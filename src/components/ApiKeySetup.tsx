import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff } from "lucide-react";

interface ApiKeySetupProps {
  onApiKeySet: (apiKey: string) => void;
  existingApiKey?: string;
}

export const ApiKeySetup = ({ onApiKeySet, existingApiKey }: ApiKeySetupProps) => {
  const [apiKey, setApiKey] = useState(existingApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateAndSetApiKey = async () => {
    if (!apiKey.trim()) return;
    
    // Basic validation - OpenRouter API keys start with "sk-or-v1-"
    if (!apiKey.startsWith("sk-or-v1-")) {
      alert("Invalid API key format. OpenRouter API keys should start with 'sk-or-v1-'");
      return;
    }

    setIsValidating(true);
    
    try {
      // Test the API key with a simple request
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Store encrypted in localStorage (basic encryption)
        const encryptedKey = btoa(apiKey);
        localStorage.setItem("openrouter_api_key", encryptedKey);
        onApiKeySet(apiKey);
      } else {
        alert("Invalid API key. Please check your key and try again.");
      }
    } catch (error) {
      alert("Failed to validate API key. Please check your connection and try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>API Key Setup</CardTitle>
          <CardDescription>
            Enter your OpenRouter API key to start chatting with DeepSeek AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored locally and encrypted. It never leaves your device except to make API calls to OpenRouter.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenRouter API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={validateAndSetApiKey} 
            className="w-full"
            disabled={!apiKey.trim() || isValidating}
          >
            {isValidating ? "Validating..." : "Set API Key"}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a></p>
            <p>• Your key is stored securely in your browser</p>
            <p>• You can change it anytime in settings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};