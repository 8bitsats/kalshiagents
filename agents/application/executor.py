import os
import json
import ast
import re
from typing import List, Dict, Any

import math

from dotenv import load_dotenv
from xai_sdk import Client
from xai_sdk.chat import user as xai_user, system as xai_system
from xai_sdk.chat import tool_result
from xai_sdk.tools import web_search, x_search, get_tool_call_type

from agents.polymarket.gamma import GammaMarketClient as Gamma
from agents.connectors.chroma import PolymarketRAG as Chroma
from agents.utils.objects import SimpleEvent, SimpleMarket
from agents.application.prompts import Prompter
from agents.polymarket.polymarket import Polymarket
from agents.polymarket.grok_tools import create_polymarket_tools, execute_polymarket_tool

def retain_keys(data, keys_to_retain):
    if isinstance(data, dict):
        return {
            key: retain_keys(value, keys_to_retain)
            for key, value in data.items()
            if key in keys_to_retain
        }
    elif isinstance(data, list):
        return [retain_keys(item, keys_to_retain) for item in data]
    else:
        return data

class Executor:
    def __init__(self, default_model=None) -> None:
        load_dotenv()
        # Use GROK_MODEL from env or default to grok-4-1-fast
        self.model = os.getenv("GROK_MODEL", "grok-4-1-fast")
        if default_model:
            self.model = default_model
        
        max_token_model = {'grok-4-1-fast': 95000, 'grok-4-fast': 95000, 'grok-4': 95000}
        self.token_limit = max_token_model.get(self.model, 95000)
        self.prompter = Prompter()
        self.xai_api_key = os.getenv("XAI_API_KEY")
        if not self.xai_api_key:
            raise ValueError("XAI_API_KEY environment variable is required")
        
        # Initialize clients first
        self.gamma = Gamma()
        self.chroma = Chroma()
        self.polymarket = Polymarket()
        
        # Initialize xAI client
        self.client = Client(api_key=self.xai_api_key, timeout=3600)
        
        # Create tools: web search, X search, and custom Polymarket tools
        self.polymarket_tools = create_polymarket_tools(self.polymarket, self.gamma)
        self.tools = [
            web_search(enable_image_understanding=True),  # Enable vision
            x_search(enable_image_understanding=True, enable_video_understanding=True),
        ] + self.polymarket_tools

    def get_llm_response(self, user_input: str) -> str:
        """Get LLM response using Grok with tools."""
        chat = self.client.chat.create(
            model=self.model,
            tools=self.tools,
            store_messages=True,
        )
        chat.append(xai_system(str(self.prompter.market_analyst())))
        chat.append(xai_user(user_input))
        
        # Handle tool calls in a loop
        while True:
            response = chat.sample()
            
            # Check for client-side tool calls (Polymarket tools)
            client_side_tool_calls = []
            for tool_call in response.tool_calls:
                tool_type = get_tool_call_type(tool_call)
                if tool_type == "client_side_tool":
                    client_side_tool_calls.append(tool_call)
            
            # Execute Polymarket tools
            if client_side_tool_calls:
                chat = self.client.chat.create(
                    model=self.model,
                    tools=self.tools,
                    store_messages=True,
                    previous_response_id=response.id,
                )
                for tool_call in client_side_tool_calls:
                    tool_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)
                    result = execute_polymarket_tool(
                        tool_name, args, self.polymarket, self.gamma
                    )
                    chat.append(tool_result(result, call_id=tool_call.id))
            else:
                return response.content

    def get_superforecast(
        self, event_title: str, market_question: str, outcome: str
    ) -> str:
        """Get superforecast using Grok with search tools."""
        prompt = self.prompter.superforecaster(
            description=event_title, question=market_question, outcome=outcome
        )
        chat = self.client.chat.create(
            model=self.model,
            tools=self.tools,
            store_messages=True,
        )
        chat.append(xai_user(prompt))
        
        # Handle tool calls
        while True:
            response = chat.sample()
            client_side_tool_calls = []
            for tool_call in response.tool_calls:
                tool_type = get_tool_call_type(tool_call)
                if tool_type == "client_side_tool":
                    client_side_tool_calls.append(tool_call)
            
            if client_side_tool_calls:
                chat = self.client.chat.create(
                    model=self.model,
                    tools=self.tools,
                    store_messages=True,
                    previous_response_id=response.id,
                )
                for tool_call in client_side_tool_calls:
                    tool_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)
                    result = execute_polymarket_tool(
                        tool_name, args, self.polymarket, self.gamma
                    )
                    chat.append(tool_result(result, call_id=tool_call.id))
            else:
                return response.content


    def estimate_tokens(self, text: str) -> int:
        # This is a rough estimate. For more accurate results, consider using a tokenizer.
        return len(text) // 4  # Assuming average of 4 characters per token

    def process_data_chunk(self, data1: List[Dict[Any, Any]], data2: List[Dict[Any, Any]], user_input: str) -> str:
        """Process data chunk using Grok."""
        system_prompt = str(self.prompter.prompts_polymarket(data1=data1, data2=data2))
        chat = self.client.chat.create(
            model=self.model,
            tools=self.tools,
            store_messages=True,
        )
        chat.append(xai_system(system_prompt))
        chat.append(xai_user(user_input))
        
        # Handle tool calls
        while True:
            response = chat.sample()
            client_side_tool_calls = []
            for tool_call in response.tool_calls:
                tool_type = get_tool_call_type(tool_call)
                if tool_type == "client_side_tool":
                    client_side_tool_calls.append(tool_call)
            
            if client_side_tool_calls:
                chat = self.client.chat.create(
                    model=self.model,
                    tools=self.tools,
                    store_messages=True,
                    previous_response_id=response.id,
                )
                for tool_call in client_side_tool_calls:
                    tool_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)
                    result = execute_polymarket_tool(
                        tool_name, args, self.polymarket, self.gamma
                    )
                    chat.append(tool_result(result, call_id=tool_call.id))
            else:
                return response.content


    def divide_list(self, original_list, i):
        # Calculate the size of each sublist
        sublist_size = math.ceil(len(original_list) / i)
        
        # Use list comprehension to create sublists
        return [original_list[j:j+sublist_size] for j in range(0, len(original_list), sublist_size)]
    
    def get_polymarket_llm(self, user_input: str) -> str:
        data1 = self.gamma.get_current_events()
        data2 = self.gamma.get_current_markets()
        
        combined_data = str(self.prompter.prompts_polymarket(data1=data1, data2=data2))
        
        # Estimate total tokens
        total_tokens = self.estimate_tokens(combined_data)
        
        # Set a token limit (adjust as needed, leaving room for system and user messages)
        token_limit = self.token_limit
        if total_tokens <= token_limit:
            # If within limit, process normally
            return self.process_data_chunk(data1, data2, user_input)
        else:
            # If exceeding limit, process in chunks
            chunk_size = len(combined_data) // ((total_tokens // token_limit) + 1)
            print(f'total tokens {total_tokens} exceeding llm capacity, now will split and answer')
            group_size = (total_tokens // token_limit) + 1 # 3 is safe factor
            keys_no_meaning = ['image','pagerDutyNotificationEnabled','resolvedBy','endDate','clobTokenIds','negRiskMarketID','conditionId','updatedAt','startDate']
            useful_keys = ['id','questionID','description','liquidity','clobTokenIds','outcomes','outcomePrices','volume','startDate','endDate','question','questionID','events']
            data1 = retain_keys(data1, useful_keys)
            cut_1 = self.divide_list(data1, group_size)
            cut_2 = self.divide_list(data2, group_size)
            cut_data_12 = zip(cut_1, cut_2)

            results = []

            for cut_data in cut_data_12:
                sub_data1 = cut_data[0]
                sub_data2 = cut_data[1]
                sub_tokens = self.estimate_tokens(str(self.prompter.prompts_polymarket(data1=sub_data1, data2=sub_data2)))

                result = self.process_data_chunk(sub_data1, sub_data2, user_input)
                results.append(result)
            
            combined_result = " ".join(results)
            
        
            
            return combined_result
    def filter_events(self, events: "list[SimpleEvent]") -> str:
        """Filter events using Grok."""
        prompt = self.prompter.filter_events(events)
        chat = self.client.chat.create(
            model=self.model,
            tools=self.tools,
            store_messages=True,
        )
        chat.append(xai_user(prompt))
        response = chat.sample()
        return response.content

    def filter_events_with_rag(self, events: "list[SimpleEvent]") -> str:
        prompt = self.prompter.filter_events()
        print()
        print("... prompting ... ", prompt)
        print()
        return self.chroma.events(events, prompt)

    def map_filtered_events_to_markets(
        self, filtered_events: "list[SimpleEvent]"
    ) -> "list[SimpleMarket]":
        markets = []
        for e in filtered_events:
            data = json.loads(e[0].json())
            market_ids = data["metadata"]["markets"].split(",")
            for market_id in market_ids:
                market_data = self.gamma.get_market(market_id)
                formatted_market_data = self.polymarket.map_api_to_market(market_data)
                markets.append(formatted_market_data)
        return markets

    def filter_markets(self, markets) -> "list[tuple]":
        prompt = self.prompter.filter_markets()
        print()
        print("... prompting ... ", prompt)
        print()
        return self.chroma.markets(markets, prompt)

    def source_best_trade(self, market_object) -> str:
        """Source best trade using Grok with search and Polymarket tools."""
        market_document = market_object[0].dict()
        market = market_document["metadata"]
        outcome_prices = ast.literal_eval(market["outcome_prices"])
        outcomes = ast.literal_eval(market["outcomes"])
        question = market["question"]
        description = market_document["page_content"]

        prompt = self.prompter.superforecaster(question, description, outcomes)
        print()
        print("... prompting with Grok ... ", prompt)
        print()
        
        chat = self.client.chat.create(
            model=self.model,
            tools=self.tools,
            store_messages=True,
        )
        chat.append(xai_user(prompt))
        
        # Handle tool calls for superforecast
        while True:
            response = chat.sample()
            client_side_tool_calls = []
            for tool_call in response.tool_calls:
                tool_type = get_tool_call_type(tool_call)
                if tool_type == "client_side_tool":
                    client_side_tool_calls.append(tool_call)
            
            if client_side_tool_calls:
                chat = self.client.chat.create(
                    model=self.model,
                    tools=self.tools,
                    store_messages=True,
                    previous_response_id=response.id,
                )
                for tool_call in client_side_tool_calls:
                    tool_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)
                    result = execute_polymarket_tool(
                        tool_name, args, self.polymarket, self.gamma
                    )
                    chat.append(tool_result(result, call_id=tool_call.id))
            else:
                content = response.content
                break

        print("result: ", content)
        print()
        prompt = self.prompter.one_best_trade(content, outcomes, outcome_prices)
        print("... prompting ... ", prompt)
        print()
        
        chat = self.client.chat.create(
            model=self.model,
            tools=self.tools,
            store_messages=True,
        )
        chat.append(xai_user(prompt))
        response = chat.sample()
        content = response.content

        print("result: ", content)
        print()
        return content

    def format_trade_prompt_for_execution(self, best_trade: str) -> float:
        data = best_trade.split(",")
        # price = re.findall(r"\d+\.\d+", data[0])[0]
        size = re.findall(r"\d+\.\d+", data[1])[0]
        usdc_balance = self.polymarket.get_usdc_balance()
        return float(size) * usdc_balance

    def source_best_market_to_create(self, filtered_markets) -> str:
        """Source best market to create using Grok."""
        prompt = self.prompter.create_new_market(filtered_markets)
        print()
        print("... prompting with Grok ... ", prompt)
        print()
        chat = self.client.chat.create(
            model=self.model,
            tools=self.tools,
            store_messages=True,
        )
        chat.append(xai_user(prompt))
        response = chat.sample()
        content = response.content
        return content
