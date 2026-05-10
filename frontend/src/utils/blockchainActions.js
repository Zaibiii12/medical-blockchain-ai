import { getContract } from "../blockchain";

// 🚀 Upload hash to blockchain
export const uploadToBlockchain = async (fileHash) => {
  try {
    const contract = await getContract();

    if (!contract) {
      alert("Contract not loaded");
      return;
    }

    console.log("Uploading to blockchain...");

    const tx = await contract.uploadRecord(fileHash);

    console.log("Transaction sent:", tx.hash);

    await tx.wait();

    console.log("Transaction confirmed!");

    alert("Uploaded successfully!");
  } catch (error) {
    console.error("Upload error:", error);
    alert("Upload failed");
  }
};