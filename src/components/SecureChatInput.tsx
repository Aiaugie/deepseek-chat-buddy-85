import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface SecureChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_DELAY = 1000; // 1 second between messages

export const SecureChatInput = ({ onSendMessage, isLoading }: SecureChatInputProps) => {
  const [input, setInput] = useState("");
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const sanitizeInput = (text: string): string => {
    // Remove potential script tags and other dangerous content
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .trim();
  };

  const validateInput = (text: string): { isValid: boolean; error?: string } => {
    if (!text.trim()) {
      return { isValid: false, error: "Message cannot be empty" };
    }
    
    if (text.length > MAX_MESSAGE_LENGTH) {
      return { isValid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` };
    }

    // Check for rate limiting
    const now = Date.now();
    if (now - lastMessageTime < RATE_LIMIT_DELAY) {
      return { isValid: false, error: "Please wait before sending another message" };
    }

    return { isValid: true };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedInput = sanitizeInput(input);
    const validation = validateInput(sanitizedInput);
    
    if (!validation.isValid) {
      if (validation.error) {
        // Show error without console logging
        alert(validation.error);
      }
      return;
    }

    if (!isLoading) {
      onSendMessage(sanitizedInput);
      setInput("");
      setLastMessageTime(Date.now());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setInput(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-chat-input border-t border-border">
      <div className="flex-1 relative">
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[44px] max-h-[120px] resize-none bg-background text-foreground border-border focus:ring-ring"
          disabled={isLoading}
        />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {input.length}/{MAX_MESSAGE_LENGTH}
        </div>
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!input.trim() || isLoading || input.length > MAX_MESSAGE_LENGTH}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};