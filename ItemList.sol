// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ItemList {
    struct Item {
        uint id;
        string title;
        string description;
        uint price;
        bool isSold;
    }

    Item[] public items;
    uint public nextItemId;

    // Event to log purchase details
    event ItemPurchased(uint itemId, address buyer, uint amount);
    // Event to log item listing details
    event ItemListed(uint itemId, string title, uint price);

    function listItem(string memory title, string memory description, uint price) public {
        require(price > 0, "Price must be greater than zero");
        items.push(Item(nextItemId, title, description, price, false));
        emit ItemListed(nextItemId, title, price);  // Emitting the listing event
        nextItemId++;
    }

    function purchaseItem(uint itemId) public payable {
        require(itemId < nextItemId, "Item does not exist");
        Item storage item = items[itemId];
        require(msg.value >= item.price, "Not enough Ether sent");
        require(!item.isSold, "Item already sold");
        item.isSold = true;

        // Emitting the event after item is successfully purchased
        emit ItemPurchased(itemId, msg.sender, msg.value);
    }
}
