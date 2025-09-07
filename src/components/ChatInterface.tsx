import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChatMessage } from "./ChatMessage";
import { SecureChatInput } from "./SecureChatInput";
import { ApiKeySetup } from "./ApiKeySetup";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, Bot, Settings } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const MODEL = "deepseek/deepseek-chat-v3.1:free";

const getStoredApiKey = (): string | null => {
  try {
    const encrypted = localStorage.getItem("openrouter_api_key");
    return encrypted ? atob(encrypted) : null;
  } catch {
    return null;
  }
};

const clearStoredApiKey = () => {
  localStorage.removeItem("openrouter_api_key");
};

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm DeepSeek AI. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowApiKeySetup(true);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([
      {
        id: "1",
        content: "Hello! I'm DeepSeek AI. How can I assist you today?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = async (content: string) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your API key to send messages.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation context
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content,
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Chat Interface",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: conversationHistory,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        // Handle different error types without exposing details
        if (response.status === 401) {
          throw new Error("Authentication failed. Please check your API key.");
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else {
          throw new Error("Service temporarily unavailable. Please try again.");
        }
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Log error for debugging but don't expose details to user
      const errorMessage = error instanceof Error ? error.message : "Failed to send message. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySet = (newApiKey: string) => {
    setApiKey(newApiKey);
    setShowApiKeySetup(false);
  };

  const handleManageApiKey = () => {
    setShowApiKeySetup(true);
  };

  if (showApiKeySetup) {
    return <ApiKeySetup onApiKeySet={handleApiKeySet} existingApiKey={apiKey || undefined} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">DeepSeek AI Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManageApiKey}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4 mr-2" />
            API Key
          </Button>
          <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start New Chat</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear the current conversation. Are you sure you want to start a new chat?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleNewChat}>Start New Chat</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-chat-ai text-chat-ai-foreground rounded-lg px-4 py-2 border border-border">
              <div className="flex items-center gap-2">
                <div className="animate-pulse text-sm">AI is thinking...</div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <SecureChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};