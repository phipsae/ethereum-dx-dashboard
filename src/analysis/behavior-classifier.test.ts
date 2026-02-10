import { describe, it, expect } from "vitest";
import { classifyBehavior } from "./behavior-classifier.js";

describe("behavior-classifier", () => {
  it("classifies question-asking behavior", () => {
    const text = `
Before I start building, I have a few questions:

1. Which blockchain would you prefer to deploy on?
2. Do you want a simple ERC20 token or something more custom?
3. Should I include a frontend, or just the smart contracts?
4. What kind of liquidity pool mechanism do you have in mind?
5. Would you like automated market maker (AMM) functionality?
    `;
    const result = classifyBehavior(text);
    expect(result.behavior).toBe("asked-questions");
    expect(result.questionsAsked).toBeGreaterThanOrEqual(3);
  });

  it("classifies just-built behavior", () => {
    const text = `
I'll use Hardhat and Solidity for this. Let's build the token contract:

\`\`\`solidity
pragma solidity ^0.8.20;
contract Token {
    mapping(address => uint256) balances;
    function mint(uint256 amount) public {
        balances[msg.sender] += amount;
    }
}
\`\`\`

And here's the deploy script:

\`\`\`javascript
const { ethers } = require("hardhat");
async function main() {
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
    console.log("Deployed to:", token.address);
}
main();
\`\`\`
    `;
    const result = classifyBehavior(text);
    expect(result.behavior).toBe("just-built");
    expect(result.decisionsStated.length).toBeGreaterThan(0);
  });

  it("classifies mixed behavior", () => {
    const text = `
Great idea! I'll use Ethereum with Solidity. Let me build a basic version:

\`\`\`solidity
pragma solidity ^0.8.20;
contract Staking {
    function stake() public payable {}
}
\`\`\`

\`\`\`javascript
const main = async () => { /* deploy */ };
\`\`\`

A few things to consider:
- What token do you want users to stake?
- Should rewards be distributed linearly or with a curve?
- Do you need a timelock on unstaking?
- Which network should we target?
    `;
    const result = classifyBehavior(text);
    expect(result.behavior).toBe("mixed");
  });

  it("captures decision statements", () => {
    const text = `
I'll use Hardhat for the development environment. Let's go with OpenZeppelin for the base contracts.
I'm going to use React for the frontend.
    `;
    const result = classifyBehavior(text);
    expect(result.decisionsStated.length).toBeGreaterThanOrEqual(2);
  });
});
