from web3 import Web3
import json

# =========================
# CONNECT TO LOCAL BLOCKCHAIN
# =========================
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

if not w3.is_connected():
    raise Exception("❌ Blockchain not connected")


# =========================
# CONTRACT ADDRESS
# =========================
contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"


# =========================
# LOAD ABI FROM HARDFAT ARTIFACTS
# =========================
with open(
    "artifacts/contracts/MedicalRecords.sol/MedicalRecords.json",
    "r"
) as file:
    contract_json = json.load(file)
    abi = contract_json["abi"]


# =========================
# CONTRACT INSTANCE
# =========================
contract = w3.eth.contract(
    address=contract_address,
    abi=abi
)


# =========================
# GET ACCOUNT (Hardhat local account)
# =========================
def get_account():
    return w3.eth.accounts[0]


# =========================
# UPLOAD MEDICAL RECORD HASH
# =========================
def upload_record(file_hash: str):
    account = get_account()

    tx = contract.functions.uploadRecord(file_hash).build_transaction({
        "from": account,
        "nonce": w3.eth.get_transaction_count(account),
        "gas": 3000000,
        "gasPrice": w3.to_wei("1", "gwei")
    })

    # Sign automatically (Hardhat local = no real private key needed)
    tx_hash = w3.eth.send_transaction(tx)

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return {
        "tx_hash": tx_hash.hex(),
        "status": receipt.status
    }


# =========================
# GET RECORD COUNT
# =========================
def get_record_count():
    return contract.functions.getRecordCount().call()


# =========================
# GET RECORD BY INDEX
# =========================
def get_record(index: int):
    return contract.functions.getRecord(index).call()