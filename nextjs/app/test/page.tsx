"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback} from "@/components/ui/avatar"
import { ChevronLeft, Camera, Send } from 'lucide-react'

interface Message {
    id: number;
    text: string;
    sender: string;
    isProduct?: boolean;
    productName?: string;
    productPrice?: string;
    isListingPrompt?: boolean;
}

const API_KEY = process.env.NEXT_PUBLIC_DIFY_API_KEY;
const USER_ID = "user123";

async function runDifyWorkflow(chatHistory: string, userName: string) {
    const url = "https://api.dify.ai/v1/workflows/run";
    const headers = {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
    };

    const payload = {
        inputs: { history: chatHistory, user_name: userName },
        response_mode: "blocking",
        user: USER_ID
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log("Dify API response:", data);
        return data.data.outputs.exhibit_required;
    } catch (error) {
        console.error("Error calling Dify API:", error);
        return false;
    }
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "こんにちは！車について語り合いましょう。", sender: "佐藤" },
        { id: 2, text: "いいですね！最近、新しい車を買おうか迷っているんです。", sender: "小林" },
        { id: 3, text: "どんな車を検討されているんですか？", sender: "佐藤" },
        { id: 4, text: "電気自動車を考えています。環境にも優しいですし。", sender: "小林" },
        { id: 5, text: "いいですね！実は私も先月電気自動車を買ったんです。", sender: "佐藤" },
        {
            id: 6,
            text: "素を整理していたら古い車のパーツが出てきたので、売ろうかなと思っています。",
            sender: "小林",
            isProduct: true,
            productName: "あいうえお",
            productPrice: "¥2,999"
        },
        { id: 7, text: "それはいい考えですね。きっと欲しい人がいるはずです。", sender: "佐藤" },
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim()) {
            const newMessage: Message = {
                id: Date.now(),
                text: input,
                sender: '自分',
            };
            setMessages(prevMessages => [...prevMessages, newMessage]);
            setInput('');

            // Prepare chat history for API call
            const chatHistory = [...messages, newMessage]
                .map(msg => `${msg.sender}: ${msg.text}`)
                .join('\n');

            const shouldShowPrompt = await runDifyWorkflow(chatHistory, '自分');

            if (shouldShowPrompt) {
                const listingPrompt: Message = {
                    id: Date.now() + 1,
                    text: "出品してみませんか？",
                    sender: 'システム',
                    isListingPrompt: true,
                };
                setMessages(prevMessages => [...prevMessages, listingPrompt]);
            }
        }
    };

    const handleList = () => {
        setMessages(prev => [...prev, { id: Date.now(), text: "出品プロセスを開始します。", sender: 'システム' }]);
    };

    const handleLater = () => {
        setMessages(prev => [...prev, { id: Date.now(), text: "わかりました。後でお知らせします。", sender: 'システム' }]);
    };

    return (
        <Card className="w-full max-w-md mx-auto h-[600px] flex flex-col bg-white">
            <CardHeader className="flex flex-col space-y-4 p-4 bg-white border-b">
                <div className="flex items-center">
                    <ChevronLeft className="h-6 w-6 text-gray-600" />
                    <h2 className="text-lg font-semibold ml-2 text-black">車について語ろう</h2>
                </div>
                <div className="flex space-x-2 overflow-x-auto">
                    {[...Array(8)].map((_, i) => (
                        <Avatar key={i} className="w-10 h-10 border-2 border-white">
                            <AvatarFallback className="bg-gray-200 text-gray-600">{String.fromCharCode(65 + i)}</AvatarFallback>
                        </Avatar>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 bg-gray-100">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === '自分' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${message.sender === '自分' ? 'bg-blue-100' : message.sender === 'システム' ? 'bg-yellow-100' : 'bg-white'} rounded-lg p-2 shadow`}>
                                <p className="text-xs mb-1 text-gray-500">{message.sender}</p>
                                <p className="text-black">{message.text}</p>
                                {message.isProduct && (
                                    <div className="mt-2 bg-white rounded p-2 border border-gray-200">
                                        <p className="font-bold text-black">{message.productName}</p>
                                        <p className="text-gray-600">{message.productPrice}</p>
                                    </div>
                                )}
                                {message.isListingPrompt && (
                                    <div className="mt-2 flex justify-center space-x-2">
                                        <Button onClick={handleList} className="bg-red-500 hover:bg-red-600 text-white text-sm">
                                            出品する
                                        </Button>
                                        <Button onClick={handleLater} variant="outline" className="text-sm">
                                            あとで
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </CardContent>
            <div className="p-4 border-t bg-white">
                <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost" className="text-gray-400">
                        <Camera className="h-6 w-6" />
                    </Button>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="コメントする"
                        className="flex-1 border-gray-300"
                    />
                    <Button size="icon" onClick={handleSend} className="bg-gray-200 text-gray-600">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}