window.addEventListener('load', async () => {
    // contract information
    const web3 = new Web3(window.ethereum);
    const contractAddress = "0x70B86d5bE5e59f52d8C5917d8db927945f50B6eB";
    const abi = [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "itemId",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "title",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                }
            ],
            "name": "ItemListed",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "itemId",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "buyer",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "ItemPurchased",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "title",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "description",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                }
            ],
            "name": "listItem",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "itemId",
                    "type": "uint256"
                }
            ],
            "name": "purchaseItem",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "items",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "title",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "description",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "isSold",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "nextItemId",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]; // The ABI array as you provided previously

    // connect wallet button and functionality
    const contract = new web3.eth.Contract(abi, contractAddress);
    const connectButton = document.getElementById('connectButton');
    const listItemForm = document.getElementById('listItemForm');
    const itemsContainer = document.getElementById('items');
    let transactionDetails = {};

    connectButton.addEventListener('click', async () => {
        await ethereum.request({ method: 'eth_requestAccounts' });
        connectButton.style.display = 'none';
        listItemForm.style.display = 'block';
        await fetchTransactionHashes();
        displayItems();
    });

    // List item functionality
    listItemForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const price = web3.utils.toWei(document.getElementById('price').value, 'ether');

        try {
            const receipt = await contract.methods.listItem(title, description, price).send({ from: ethereum.selectedAddress });
            const itemId = receipt.events.ItemListed.returnValues.itemId;
            transactionDetails[itemId] = { listingHash: receipt.transactionHash };
            localStorage.setItem('transactionDetails', JSON.stringify(transactionDetails)); 
            displayItems();
        } catch (error) {
            console.error('Error listing item:', error);
        }
    });
    
    // purchase item thing
    window.purchaseItem = async (itemId) => {
        try {
            const receipt = await contract.methods.purchaseItem(itemId).send({ from: ethereum.selectedAddress, value: web3.utils.toWei('0.0001', 'ether') });
            transactionDetails[itemId].purchaseHash = receipt.transactionHash;
            localStorage.setItem('transactionDetails', JSON.stringify(transactionDetails)); 
            displayItems();
        } catch (error) {
            console.error('Error purchasing item:', error);
        }
    };

    //get the previous and purchaesed transaction hashes that fetches everything from the blockchain
    async function fetchTransactionHashes() {
        const listedEvents = await contract.getPastEvents('ItemListed', { fromBlock: 0, toBlock: 'latest' });
        const purchasedEvents = await contract.getPastEvents('ItemPurchased', { fromBlock: 0, toBlock: 'latest' });

        listedEvents.forEach(event => {
            const itemId = event.returnValues.itemId;
            transactionDetails[itemId] = transactionDetails[itemId] || {};
            transactionDetails[itemId].listingHash = event.transactionHash;
        });

        purchasedEvents.forEach(event => {
            const itemId = event.returnValues.itemId;
            transactionDetails[itemId] = transactionDetails[itemId] || {};
            transactionDetails[itemId].purchaseHash = event.transactionHash;
        });
    }

    async function displayItems() {
        const totalItems = await contract.methods.nextItemId().call();
        itemsContainer.innerHTML = '';
        for (let i = 0; i < totalItems; i++) {
            const item = await contract.methods.items(i).call();
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.description}</p>
                <p>Price: ${web3.utils.fromWei(item.price, 'ether')} ETH</p>
                <p>Listing Hash: ${transactionDetails[i]?.listingHash || 'Not available'}</p>
                <p>Purchase Hash: ${transactionDetails[i]?.purchaseHash || 'Not available'}</p>
                ${item.isSold ? '<p>Sold Out</p>' : '<button onclick="purchaseItem(' + i + ')">Buy</button>'}
            `;
            itemsContainer.appendChild(itemElement);
        }
    }
});
