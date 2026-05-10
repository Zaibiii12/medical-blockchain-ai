import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { contractAddress } from "./contracts/address";
import { abi } from "./contracts/MedicalRecordsABI";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);

  // Form states
  const [doctorAddress, setDoctorAddress] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch the Backend URL from environment variables
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

  // Connect MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const medicalContract = new ethers.Contract(contractAddress, abi, signer);
        setContract(medicalContract);

        await checkUserRoles(medicalContract, address);
      } catch (error) {
        console.error("Connection error:", error);
        alert("Failed to connect wallet.");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const checkUserRoles = async (contractInstance, userAddress) => {
    try {
      const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const DOCTOR_ROLE = await contractInstance.DOCTOR_ROLE();

      const adminCheck = await contractInstance.hasRole(ADMIN_ROLE, userAddress);
      const doctorCheck = await contractInstance.hasRole(DOCTOR_ROLE, userAddress);

      setIsAdmin(adminCheck);
      setIsDoctor(doctorCheck);
    } catch (error) {
      console.error("Error checking roles:", error);
    }
  };

  const handleAddDoctor = async () => {
    const cleanAddress = doctorAddress.trim();
    if (!ethers.isAddress(cleanAddress)) {
      alert("Invalid address format!");
      return;
    }
    try {
      const tx = await contract.addDoctor(cleanAddress);
      await tx.wait();
      alert("Doctor authorized successfully!");
    } catch (error) {
      alert("Action failed. Check if you are the Admin.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !patientAddress || !description) return alert("Fill all fields");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Use BACKEND_URL from .env
      const response = await axios.post(`${BACKEND_URL}/upload`, formData);
      
      const { fileHash, ai_summary } = response.data;
      let finalDescription = description; 

      if (ai_summary && !ai_summary.includes("not available") && !ai_summary.includes("Error")) {
          finalDescription = `${description} | AI Notes: ${ai_summary}`;
      }

      const tx = await contract.uploadRecord(patientAddress.trim(), fileHash, finalDescription);
      await tx.wait();
      alert("Record Encrypted & Stored on Blockchain!");
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const targetAddress = (patientAddress.trim() !== "" && ethers.isAddress(patientAddress.trim())) 
        ? patientAddress.trim() 
        : account;

      const data = await contract.getPatientRecords(targetAddress);
      setRecords(data);
    } catch (error) {
      alert("Unauthorized to view these records.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <span>🛡️</span> MedChain Dashboard
        </h1>
        {!account ? (
          <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-md">
            Connect Wallet
          </button>
        ) : (
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Account</p>
            <p className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                {account.substring(0, 6)}...{account.slice(-4)}
            </p>
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Admin Section */}
        {isAdmin && (
          <section className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-red-500">
            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
              <span>👑</span> Administrator Panel
            </h3>
            <div className="flex gap-4">
              <input 
                className="flex-1 border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-red-400 outline-none"
                placeholder="Doctor Wallet Address" 
                onChange={e => setDoctorAddress(e.target.value)} 
              />
              <button onClick={handleAddDoctor} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition font-bold">
                Authorize
              </button>
            </div>
          </section>
        )}

        {/* Doctor Section */}
        {isDoctor && (
          <section className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-green-500">
            <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
              <span>👨‍⚕️</span> Doctor Portal
            </h3>
            <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold">Patient Address</label>
                <input className="w-full border-2 border-slate-100 rounded-lg px-4 py-2" placeholder="0x..." onChange={e => setPatientAddress(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Diagnosis Title</label>
                <input className="w-full border-2 border-slate-100 rounded-lg px-4 py-2" placeholder="e.g. Blood Test" onChange={e => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">Medical Report</label>
                <input type="file" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-6 file:rounded-full file:bg-green-50 file:text-green-700" onChange={e => setFile(e.target.files[0])} required />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className={`md:col-span-2 py-3 rounded-lg font-black text-white shadow-lg transition ${loading ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {loading ? "🤖 AI Processing..." : "🔒 Encrypt & Upload"}
              </button>
            </form>
          </section>
        )}

        {/* Records View */}
        <section className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-blue-500">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-xl font-black text-blue-600">📋 Verified Records</h3>
            <button onClick={fetchRecords} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
              Fetch
            </button>
          </div>

          <div className="space-y-6">
            {records.map((rec, index) => (
              <div key={index} className="border-2 border-slate-50 rounded-2xl p-6 hover:bg-blue-50/50 shadow-sm transition-all">
                <div className="flex justify-between items-start mb-4">
                  <a 
                    href={`${BACKEND_URL}/download/${rec.fileHash}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-600 font-black text-lg hover:underline"
                  >
                    🔓 View Secure PDF
                  </a>
                  <span className="text-xs font-bold text-slate-500 bg-white border px-3 py-1 rounded-full">
                    {new Date(Number(rec.timestamp)*1000).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-700 italic"><span className="font-black text-slate-900 not-italic">Diagnosis:</span> {rec.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;