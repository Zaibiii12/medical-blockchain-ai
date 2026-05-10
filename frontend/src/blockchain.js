import { ethers } from "ethers";
import contractArtifact from "./abi/MedicalRecords.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const getContract = async () => {

  try {

    if (!window.ethereum) {
      alert("Install MetaMask");
      return null;
    }

    await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      contractAddress,
      contractArtifact.abi,
      signer
    );

    return contract;

  } catch (error) {

    console.error(error);

    return null;
  }
};