// src/pages/Chatbot.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Bot, Loader2 } from "lucide-react"; // Import Loader2
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Import Avatar

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! I'm your Palm Mitra AI assistant. How can I help you with oil palm farming today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [farmerInitial, setFarmerInitial] = useState("🧑‍🌾"); // State for farmer initial/avatar

  // Get farmer initial on load
  useEffect(() => {
    const profile = localStorage.getItem("farmerProfile");
    if (profile) {
      try {
        const data = JSON.parse(profile);
        setFarmerInitial(data.name?.charAt(0).toUpperCase() || "🧑‍🌾");
      } catch (e) { console.error("Couldn't parse profile for initial"); }
    }
  }, []);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]); // Scroll whenever messages change

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
        // Prepare request body, including language if available
        const langCode = localStorage.getItem("selectedLanguage") || 'en';
        const requestBody = {
            prompt: prompt,
            language: langCode // Pass language to the function
        };

        console.log("Invoking Supabase function 'gemini-bot' with body:", requestBody);

        // Call Supabase function
        const { data, error } = await supabase.functions.invoke('gemini-bot', {
            body: JSON.stringify(requestBody),
            // No Auth header needed if using --no-verify-jwt during deploy and function doesn't require it
        });

        console.log("Function response:", { data, error });


        if (error) {
            // Handle specific errors if possible
            if (error instanceof Error && error.message.includes('Function not found')) {
                 throw new Error("Chatbot function not found. Please ensure it's deployed.");
            } else if (error instanceof Error && error.message.includes('Failed to fetch')) {
                 throw new Error("Network error. Could not reach the chatbot service.");
            }
             throw error; // Re-throw other errors
        }

        if (data && data.reply) {
             setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } else if (data && data.error) {
             // Handle errors returned *from* the function's logic
             throw new Error(`Chatbot error: ${data.error}`);
        }
         else {
             throw new Error("Received an unexpected response from the chatbot.");
        }


    } catch (error: any) {
        console.error("Error in handleSend:", error);
        const errorMessage = error.message || "Sorry, I couldn't get a response. Please check your connection and try again.";
        toast.error(errorMessage);
        setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
        setIsLoading(false);
        // Ensure input is re-enabled and focus is returned
        const inputElement = document.getElementById("chat-input");
        if(inputElement) inputElement.focus();
    }
};


  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col h-screen"> {/* Ensure full height */}
      {/* Header */}
      <div className="bg-card border-b shadow-soft p-3 sm:p-4 flex-shrink-0"> {/* Adjusted padding */}
        <div className="container mx-auto max-w-4xl flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
             <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                 <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5"/>
                 </AvatarFallback>
             </Avatar>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Expert Assistant</h1>
              <p className="text-xs text-muted-foreground">AI Powered by Gemini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {/* Added flex-1 and overflow-y-auto */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Assistant Avatar */}
              {message.role === 'assistant' && (
                   <Avatar className="w-8 h-8 mb-1 flex-shrink-0">
                       <AvatarFallback className="bg-primary text-primary-foreground">
                           <Bot className="w-4 h-4"/>
                       </AvatarFallback>
                   </Avatar>
              )}

              <Card
                className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 shadow-soft ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none" // Style user bubble
                    : "bg-card text-card-foreground rounded-bl-none" // Style assistant bubble
                }`}
              >
                 {/* Render content safely */}
                <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
              </Card>

              {/* User Avatar */}
               {message.role === 'user' && (
                    <Avatar className="w-8 h-8 mb-1 flex-shrink-0">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                           {farmerInitial}
                        </AvatarFallback>
                    </Avatar>
               )}
            </div>
          ))}
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start items-end gap-2">
                 <Avatar className="w-8 h-8 mb-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4"/>
                    </AvatarFallback>
                 </Avatar>
                <Card className="max-w-[80%] p-3 sm:p-4 bg-card rounded-bl-none shadow-soft">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground italic mr-2">Thinking</span>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce delay-150" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce delay-300" />
                  </div>
                </Card>
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {/* Added flex-shrink-0 */}
      <div className="bg-card border-t shadow-soft p-3 sm:p-4 flex-shrink-0">
        <div className="container mx-auto max-w-4xl flex gap-2">
          <Input
            id="chat-input" // Added ID for focusing
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()} // Prevent send while loading
            placeholder="Ask your question..."
            className="flex-1 h-12" // Increased height slightly
            disabled={isLoading}
            autoComplete="off"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="h-12 w-12 flex-shrink-0">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;