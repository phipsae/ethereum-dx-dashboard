export interface Prompt {
  id: string;
  text: string;
  category: string;
}

export const PROMPTS: Prompt[] = [
  {
    id: "token-launch",
    text: "Build me a token launch platform where creators can deploy their own tokens and set up liquidity pools.",
    category: "DeFi",
  },
  {
    id: "nft-marketplace",
    text: "Create an NFT marketplace where users can mint, buy, and sell digital art with royalty support.",
    category: "NFT",
  },
  {
    id: "dao-voting",
    text: "Build a DAO voting system where token holders can create proposals and vote on them.",
    category: "Governance",
  },
  {
    id: "defi-staking",
    text: "Create a staking dApp where users can stake tokens and earn rewards over time.",
    category: "DeFi",
  },
  {
    id: "onchain-game",
    text: "Build an on-chain game where players can collect, trade, and battle with digital creatures.",
    category: "Gaming",
  },
];
