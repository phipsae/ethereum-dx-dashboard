import { describe, it, expect } from "vitest";
import { detectChain } from "./chain-detector.js";

describe("chain-detector", () => {
  it("detects Ethereum from Solidity code", () => {
    const text = `
Here's a token contract:
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
\`\`\`

Deploy with Hardhat:
\`\`\`
npx hardhat deploy
\`\`\`
    `;
    const result = detectChain(text);
    expect(result.chain).toBe("Ethereum");
    expect(result.confidence).toBeGreaterThan(80);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("detects Solana from Anchor code", () => {
    const text = `
\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod my_program {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}
\`\`\`

Install @solana/web3.js for the frontend.
    `;
    const result = detectChain(text);
    expect(result.chain).toBe("Solana");
    expect(result.confidence).toBeGreaterThan(70);
  });

  it("detects Sui from Move code", () => {
    const text = `
\`\`\`move
module my_game::creature {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;

    struct Creature has key {
        id: UID,
        power: u64,
    }

    public fun create(ctx: &mut TxContext) {
        let creature = Creature {
            id: object::new(ctx),
            power: 100,
        };
        transfer::share_object(creature);
    }
}
\`\`\`
    `;
    const result = detectChain(text);
    expect(result.chain).toBe("Sui");
    expect(result.confidence).toBeGreaterThan(60);
  });

  it("returns Unknown for unrelated text", () => {
    const text = "Here is a recipe for chocolate cake. Preheat oven to 350F.";
    const result = detectChain(text);
    expect(result.chain).toBe("Unknown");
    expect(result.confidence).toBe(0);
  });

  it("handles mixed signals with dominant chain winning", () => {
    const text = `
I'll build this with Solidity and Hardhat on Ethereum.

pragma solidity ^0.8.20;
contract Token is ERC20 {
    mapping(address => uint256) balances;
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient");
        emit Transfer(msg.sender, to, amount);
    }
}

You could also deploy this on Solana but I'll use Ethereum.
    `;
    const result = detectChain(text);
    expect(result.chain).toBe("Ethereum");
    expect(result.confidence).toBeGreaterThan(70);
  });

  it("detects Cosmos from CosmWasm code", () => {
    const text = `
Let's use CosmWasm with the Cosmos SDK:
\`\`\`rust
use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response};
\`\`\`
    `;
    const result = detectChain(text);
    expect(result.chain).toBe("Cosmos");
    expect(result.confidence).toBeGreaterThan(50);
  });
});
