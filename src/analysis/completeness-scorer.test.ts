import { describe, it, expect } from "vitest";
import { scoreCompleteness } from "./completeness-scorer.js";

describe("completeness-scorer", () => {
  it("scores a complete response highly", () => {
    const text = `
Here's a complete staking dApp:

## Smart Contract

\`\`\`solidity
pragma solidity ^0.8.20;
contract Staking {
    mapping(address => uint256) public stakes;
    function stake() public payable {
        stakes[msg.sender] += msg.value;
    }
    function unstake(uint256 amount) public {
        require(stakes[msg.sender] >= amount, "Insufficient");
        stakes[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
    function getReward() public view returns (uint256) {
        return stakes[msg.sender] / 100;
    }
}
\`\`\`

## Deploy Script

\`\`\`javascript
const { ethers } = require("hardhat");
async function main() {
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy();
    console.log("Deployed:", staking.address);
}
main();
\`\`\`

## Frontend

\`\`\`tsx
import { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

export default function StakingApp() {
    const { address } = useAccount();
    const [amount, setAmount] = useState('');
    return <div>Connect wallet to stake</div>;
}
\`\`\`

## Tests

\`\`\`javascript
describe("Staking", () => {
    it("should allow staking", async () => {
        expect(true).toBe(true);
    });
});
\`\`\`
    `;
    const result = scoreCompleteness(text);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.hasContract).toBe(true);
    expect(result.hasDeployScript).toBe(true);
    expect(result.hasFrontend).toBe(true);
    expect(result.hasTests).toBe(true);
  });

  it("scores contract-only response moderately", () => {
    const text = `
\`\`\`solidity
pragma solidity ^0.8.20;
contract Token {
    function mint() public {}
}
\`\`\`
    `;
    const result = scoreCompleteness(text);
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.hasContract).toBe(true);
    expect(result.hasDeployScript).toBe(false);
    expect(result.hasFrontend).toBe(false);
  });

  it("penalizes TODOs", () => {
    const text = `
\`\`\`solidity
pragma solidity ^0.8.20;
contract Token {
    function mint() public {
        // TODO: implement minting logic
        // TODO: add access control
        // PLACEHOLDER
    }
}
\`\`\`
    `;
    const withTodos = scoreCompleteness(text);

    const cleanText = text.replace(/TODO|PLACEHOLDER/g, "done");
    const withoutTodos = scoreCompleteness(cleanText);

    expect(withTodos.todoCount).toBe(3);
    expect(withTodos.score).toBeLessThan(withoutTodos.score);
  });

  it("scores empty/irrelevant text as zero", () => {
    const text = "Here's how to make a sandwich. Get bread, add filling.";
    const result = scoreCompleteness(text);
    expect(result.score).toBe(0);
    expect(result.hasContract).toBe(false);
  });
});
