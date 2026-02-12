import { describe, it, expect } from "vitest";
import { detect } from "./detector.js";

describe("detector", () => {
  it("detects Ethereum Ecosystem from generic Solidity code", () => {
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
    const result = detect(text);
    expect(result.ecosystem).toBe("Ethereum Ecosystem");
    expect(result.network).toBe("Ethereum Ecosystem");
    expect(result.strength).toBe("strong");
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
    const result = detect(text);
    expect(result.network).toBe("Solana");
    expect(result.ecosystem).toBe("Solana");
    expect(["strong", "weak"]).toContain(result.strength);
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
    const result = detect(text);
    expect(result.network).toBe("Sui");
    expect(result.ecosystem).toBe("Sui");
    expect(["strong", "weak"]).toContain(result.strength);
  });

  it("returns Unknown for unrelated text", () => {
    const text = "Here is a recipe for chocolate cake. Preheat oven to 350F.";
    const result = detect(text);
    expect(result.network).toBe("Chain-Agnostic");
    expect(result.ecosystem).toBe("Chain-Agnostic");
    expect(result.strength).toBe("implicit");
  });

  it("handles mixed signals with dominant ecosystem winning", () => {
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
    const result = detect(text);
    expect(result.ecosystem).toBe("Ethereum Ecosystem");
    expect(["strong", "weak"]).toContain(result.strength);
  });

  it("detects Cosmos from CosmWasm code", () => {
    const text = `
Let's use CosmWasm with the Cosmos SDK:
\`\`\`rust
use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response};
\`\`\`
    `;
    const result = detect(text);
    expect(result.network).toBe("Cosmos");
    expect(result.ecosystem).toBe("Cosmos");
    expect(["strong", "weak"]).toContain(result.strength);
  });

  it("detects BSC with EVM-generic boost", () => {
    const text = `
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BscToken is ERC20 {
    constructor() ERC20("BscToken", "BSC") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}

Deploy on BSC (BNB Chain) using Hardhat:
npx hardhat deploy --network bsc
Check on bscscan.
    `;
    const result = detect(text);
    expect(result.network).toBe("BSC");
    expect(result.ecosystem).toBe("BSC");
  });

  it("detects Base network with EVM-generic boost", () => {
    const text = `
pragma solidity ^0.8.20;

contract HelloBase {
    mapping(address => string) public messages;
    function setMessage(string calldata msg_) public {
        messages[msg.sender] = msg_;
    }
}

Deploy on Base chain using Hardhat.
Check on basescan.
    `;
    const result = detect(text);
    expect(result.network).toBe("Base");
    expect(result.ecosystem).toBe("Ethereum Ecosystem");
  });
});
