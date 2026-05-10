import { getContract } from "../blockchain";

export const uploadToBlockchain = async (fileHash) => {

  try {

    const contract = await getContract();

    if (!contract) {
      return;
    }

    console.log("Uploading Hash:", fileHash);

    const tx = await contract.uploadRecord(fileHash);

    console.log("Transaction Sent:", tx.hash);

    await tx.wait();

    console.log("Transaction Confirmed");

    alert("Uploaded Successfully!");

  } catch (error) {

    console.error("Upload Error:", error);

    alert("Blockchain Upload Failed");
  }
};