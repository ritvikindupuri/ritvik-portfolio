import { createContext, useContext, useState, ReactNode } from "react";

interface ChatbotContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ChatbotContext.Provider value={{ isChatOpen, setIsChatOpen }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
};
