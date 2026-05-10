import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { contractAddress } from "./contracts/address";
import { abi } from "./contracts/MedicalRecordsABI";

// --- Professional SVG Icons (Replacing Emojis) ---
const Icons = {
  Logo: () => <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Wallet: () => <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Shield: () => <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Upload: () => <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Document: () => <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Spinner: () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
};

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);

  // Form States
  const [doctorAddress, setDoctorAddress] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const medicalContract = new ethers.Contract(contractAddress, abi, signer);
        setContract(medicalContract);

        const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const DOCTOR_ROLE = await medicalContract.DOCTOR_ROLE();

        setIsAdmin(await medicalContract.hasRole(ADMIN_ROLE, address));
        setIsDoctor(await medicalContract.hasRole(DOCTOR_ROLE, address));
      } catch (error) {
        console.error("Connection error:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handleAddDoctor = async () => {
    try {
      const tx = await contract.addDoctor(doctorAddress.trim());
      await tx.wait();
      alert("Doctor authorized successfully!");
      setDoctorAddress(""); // clear input
    } catch (error) {
      alert("Action failed. Admin only.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !patientAddress || !description) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await axios.post(`${BACKEND_URL}/upload`, formData);
      const { fileHash, ai_summary } = response.data;
      const finalDescription = `${description} | AI Summary: ${ai_summary}`;

      const tx = await contract.uploadRecord(patientAddress.trim(), fileHash, finalDescription);
      await tx.wait();
      alert("Record Encrypted & Stored!");
      
      // Reset form
      setFile(null);
      setDescription("");
      setPatientAddress("");
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Upload failed. Ensure backend is running.");
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const target = patientAddress.trim() || account;
      const data = await contract.getPatientRecords(target);
      setRecords(data);
    } catch (error) {
      alert("Unauthorized to view these records.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sleek Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Icons.Logo />
              <span className="text-xl font-bold tracking-tight text-slate-900">MedChain <span className="font-light text-slate-400">| Secure Vault</span></span>
            </div>
            
            <div className="flex items-center gap-4">
              {account && (
                <div className="hidden md:flex flex-col text-right mr-4">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Access Level</span>
                  <span className="text-sm font-medium text-slate-700">
                    {isAdmin ? "System Administrator" : isDoctor ? "Verified Practitioner" : "Patient Portal"}
                  </span>
                </div>
              )}
              
              {!account ? (
                <button onClick={connectWallet} className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                  <Icons.Wallet /> Connect Web3 Wallet
                </button>
              ) : (
                <div className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-mono text-slate-600 shadow-sm">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-3"></span>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (Forms & Controls) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Admin Panel */}
            {isAdmin && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <Icons.Shield />
                  <h3 className="text-sm font-semibold text-slate-800">System Access Control</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Practitioner Wallet</label>
                    <input 
                      type="text"
                      className="block w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2.5 border outline-none transition-shadow"
                      placeholder="0x..." 
                      value={doctorAddress}
                      onChange={e => setDoctorAddress(e.target.value)} 
                    />
                  </div>
                  <button onClick={handleAddDoctor} className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                    Authorize Credentials
                  </button>
                </div>
              </div>
            )}

            {/* Doctor Panel */}
            {isDoctor && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <Icons.Upload />
                  <h3 className="text-sm font-semibold text-slate-800">Clinical Data Upload</h3>
                </div>
                <form onSubmit={handleUpload} className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Patient Address</label>
                    <input 
                      type="text" 
                      className="block w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2.5 border outline-none transition-shadow" 
                      placeholder="0x..." 
                      value={patientAddress}
                      onChange={e => setPatientAddress(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Clinical Diagnosis</label>
                    <input 
                      type="text" 
                      className="block w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2.5 border outline-none transition-shadow" 
                      placeholder="e.g. Annual Blood Work" 
                      value={description}
                      onChange={e => setDescription(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Source Document</label>
                    <input 
                      type="file" 
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg" 
                      onChange={e => setFile(e.target.files[0])} 
                      required 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                  >
                    {loading ? <><Icons.Spinner /> Encrypting & Processing...</> : "Sign & Encrypt Payload"}
                  </button>
                </form>
              </div>
            )}
            
            {/* Instruction block if no roles or not connected */}
            {!isAdmin && !isDoctor && account && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <p className="text-sm text-slate-500 leading-relaxed">
                  You are logged in as a Patient. Enter your address in the timeline panel to sync your securely encrypted medical history.
                </p>
              </div>
            )}
          </div>

          {/* Right Column (Data Timeline) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
              
              {/* Timeline Header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Patient Ledger</h3>
                  <p className="text-sm text-slate-500 mt-1">Immutable history of encrypted medical records.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <input 
                    type="text" 
                    className="block w-full sm:w-64 border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2 border outline-none" 
                    placeholder="Search by Wallet Address..." 
                    value={patientAddress}
                    onChange={e => setPatientAddress(e.target.value)} 
                  />
                  <button onClick={fetchRecords} className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                    Sync
                  </button>
                </div>
              </div>

              {/* Records List */}
              <div className="p-6">
                {records.length === 0 ? (
                  <div className="text-center py-16">
                    <Icons.Document />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No records found</h3>
                    <p className="mt-1 text-sm text-slate-500">Sync a valid patient address to view the encrypted timeline.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {records.map((r, i) => (
                      <li key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
                        <div className="flex justify-between items-start mb-3">
                          <a 
                            href={`${BACKEND_URL}/download/${r.fileHash}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
                          >
                            <Icons.Document /> View Decrypted Report
                          </a>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                            {new Date(Number(r.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="pl-7">
                          <p className="text-sm text-slate-700 leading-relaxed mb-3">
                            <strong className="text-slate-900 font-medium">Notes & AI Insight: </strong> 
                            {r.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-4 pt-3 border-t border-slate-200">
                            <span className="truncate max-w-[200px] sm:max-w-md">CID: {r.fileHash}</span>
                            <span className="flex items-center text-green-600 font-sans font-medium">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                              Verified Chain
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

export default App;