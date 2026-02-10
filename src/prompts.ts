export interface Prompt {
  id: string;
  text: string;
  category: string;
}

export const PROMPTS: Prompt[] = [
  // DeFi (3)
  {
    id: "token-launch",
    text: "Build me a platform where creators can launch their own cryptocurrency and let people trade it.",
    category: "DeFi",
  },
  {
    id: "memecoin",
    text: "Help me create and launch a meme coin with a website where people can buy it directly.",
    category: "DeFi",
  },
  {
    id: "prediction-market",
    text: "Create a platform where users can place bets on real-world events using crypto, with automatic payouts.",
    category: "DeFi",
  },

  // NFT (1)
  {
    id: "nft-marketplace",
    text: "Create a marketplace for digital collectibles where artists can sell their work and earn on resales.",
    category: "NFT",
  },

  // Governance (1)
  {
    id: "dao-voting",
    text: "Build a community voting system where coin holders can submit proposals and vote on decisions.",
    category: "Governance",
  },

  // Gaming (1)
  {
    id: "onchain-game",
    text: "Build a blockchain game where players can collect, trade, and battle with digital creatures.",
    category: "Gaming",
  },

  // Advisory (1)
  {
    id: "which-chain",
    text: "I want to build a crypto app. Which blockchain should I build on and why?",
    category: "Advisory",
  },

  // Agent (1)
  {
    id: "ai-agent",
    text: "Build me an AI agent that can autonomously trade crypto and manage a wallet.",
    category: "Agent",
  },

  // Infrastructure (2)
  {
    id: "token-bridge",
    text: "Build a way for users to move their crypto between two different blockchains.",
    category: "Infrastructure",
  },
  {
    id: "block-explorer",
    text: "Create a website that lets people look up transactions, wallet balances, and activity on a blockchain.",
    category: "Infrastructure",
  },

  // Social (1)
  {
    id: "social-tipping",
    text: "Build a platform where fans can send crypto tips to their favorite content creators.",
    category: "Social",
  },

  // Identity (1)
  {
    id: "name-service",
    text: "Create a service where people can register a readable name for their crypto wallet instead of a long address.",
    category: "Identity",
  },
];
