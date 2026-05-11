import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { contractAddress } from "./contracts/address";
import { abi } from "./contracts/MedicalRecordsABI";

// Standard UI Icons
const Icons = {
  Logo: () => <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Wallet: () => <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Shield: () => <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Upload: () => <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Document: () => <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Chat: () => <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  Key: () => <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  Alert: () => <svg className="w-4 h-4 text-red-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Spinner: () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
};

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);

  // Form States
  const [adminDoctorAddress, setAdminDoctorAddress] = useState(""); 
  const [uploadPatientAddress, setUploadPatientAddress] = useState(""); 
  const [searchPatientAddress, setSearchPatientAddress] = useState(""); 
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  
  // Advanced Permission States
  const [doctorTargetPatient, setDoctorTargetPatient] = useState(""); 
  const [pendingRequests, setPendingRequests] = useState([]);
  const [authorizedDoctors, setAuthorizedDoctors] = useState([]);
  const [emergencyLogs, setEmergencyLogs] = useState([]); // NEW: Stores audit trail
  
  // AI Chat States
  const [activeChat, setActiveChat] = useState(null); 
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  const fetchPatientPermissions = async (medicalContract, userAddress) => {
    try {
      const pendingList = await medicalContract.getPendingRequests();
      const authorizedList = await medicalContract.getAuthorizedDoctors();
      
      // Filter active doctors
      const activeDocs = [];
      for (let i = 0; i < authorizedList.length; i++) {
        const doc = authorizedList[i];
        const isStillAuthed = await medicalContract.isAuthorized(userAddress, doc);
        if (isStillAuthed && !activeDocs.includes(doc)) {
          activeDocs.push(doc);
        }
      }

      // Filter pending requests
      const truePending = [];
      for (let i = 0; i < pendingList.length; i++) {
        const doc = pendingList[i];
        const stillPending = await medicalContract.hasRequested(userAddress, doc);
        if (stillPending && !truePending.includes(doc)) {
          truePending.push(doc);
        }
      }

      setPendingRequests(truePending);
      setAuthorizedDoctors(activeDocs);

      // --- NEW: Fetch Emergency Audit Trail ---
      // We ask the blockchain to filter past EmergencyOverride events where this user is the patient
      const filter = medicalContract.filters.EmergencyOverride(null, userAddress);
      const events = await medicalContract.queryFilter(filter);
      
      const logs = events.map(e => ({
        doctor: e.args[0], // Doctor's address
        timestamp: Number(e.args[2]) * 1000 // Convert blockchain timestamp to JS milliseconds
      })).reverse(); // Put newest events at the top

      setEmergencyLogs(logs);

    } catch (error) {
      console.error("Error fetching permissions or logs:", error);
    }
  };

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

        const _isAdmin = await medicalContract.hasRole(ADMIN_ROLE, address);
        const _isDoctor = await medicalContract.hasRole(DOCTOR_ROLE, address);
        
        setIsAdmin(_isAdmin);
        setIsDoctor(_isDoctor);

        if (!_isAdmin && !_isDoctor) {
          fetchPatientPermissions(medicalContract, address);
        }
      } catch (error) {
        console.error("Connection error:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handleAddDoctor = async () => {
    try {
      const tx = await contract.addDoctor(adminDoctorAddress.trim());
      await tx.wait();
      alert("Doctor authorized into system.");
      setAdminDoctorAddress("");
    } catch (error) {
      alert("Action failed. Admin only.");
    }
  };

  const handleRequestAccess = async () => {
    try {
      const tx = await contract.requestAccess(doctorTargetPatient.trim());
      await tx.wait();
      alert("Access request sent to patient.");
      setDoctorTargetPatient("");
    } catch (error) {
      alert("Failed to send request. You may already have access or a pending request.");
      console.error(error);
    }
  };

  const handleEmergencyOverride = async () => {
    const confirmEmergency = window.confirm(
      "WARNING: You are triggering a Break-the-Glass Emergency Override.\n\nThis will bypass patient consent and permanently log an immutable audit event on the blockchain under your identity. Only proceed if this is a life-threatening emergency."
    );
    if (!confirmEmergency) return;

    try {
      const tx = await contract.emergencyOverride(doctorTargetPatient.trim());
      await tx.wait();
      alert("Emergency Access Granted. Audit event logged.");
      setDoctorTargetPatient("");
    } catch (error) {
      alert("Failed to override. You might already have access.");
      console.error(error);
    }
  };

  const handleGrantAccess = async (doctorAddress) => {
    try {
      const tx = await contract.grantAccess(doctorAddress.trim());
      await tx.wait();
      alert("Access granted successfully.");
      fetchPatientPermissions(contract, account); 
    } catch (error) {
      alert("Failed to grant access.");
    }
  };

  const handleRevokeAccess = async (doctorAddress) => {
    try {
      const tx = await contract.revokeAccess(doctorAddress.trim());
      await tx.wait();
      alert("Doctor access revoked permanently.");
      fetchPatientPermissions(contract, account); 
    } catch (error) {
      alert("Failed to revoke access.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !uploadPatientAddress || !description) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await axios.post(`${BACKEND_URL}/upload`, formData);
      const { fileHash, ai_summary } = response.data;
      const finalDescription = `${description} | AI Summary: ${ai_summary}`;

      const tx = await contract.uploadRecord(uploadPatientAddress.trim(), fileHash, finalDescription);
      await tx.wait();
      alert("Record Encrypted & Stored on Blockchain!");
      
      setFile(null);
      setDescription("");
      setUploadPatientAddress("");
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const target = searchPatientAddress.trim() || account;
      const data = await contract.getPatientRecords(target);
      setRecords(data);
    } catch (error) {
      const target = searchPatientAddress.trim() || account;
      alert(`Access Denied.\n\nYou are logged in as: ${account.slice(0,6)}...\nYou are trying to view: ${target.slice(0,6)}...\n\nOnly the Patient or an Authorized Doctor can view this.`);
    }
  };

  const handleChatSubmit = async () => {
    if (!userQuestion.trim()) return;
    setChatLoading(true);
    setAiAnswer("");
    
    try {
      const response = await axios.post(`${BACKEND_URL}/chat`, {
        ipfs_hash: activeChat,
        question: userQuestion
      });
      setAiAnswer(response.data.answer);
      setUserQuestion("");
    } catch (error) {
      setAiAnswer("Error reaching AI service. Please try again.");
    }
    setChatLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative">
      
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
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
                <button onClick={connectWallet} className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            
            {/* ADMIN PANEL */}
            {isAdmin && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <Icons.Shield />
                  <h3 className="text-sm font-semibold text-slate-800">System Access Control</h3>
                </div>
                <div className="p-6 space-y-4">
                  <input 
                    className="block w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 sm:text-sm px-4 py-2.5 border outline-none"
                    placeholder="Doctor Wallet (0x...)" 
                    value={adminDoctorAddress}
                    onChange={e => setAdminDoctorAddress(e.target.value)} 
                  />
                  <button onClick={handleAddDoctor} className="w-full py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
                    Authorize Practitioner
                  </button>
                </div>
              </div>
            )}

            {/* DOCTOR PANELS */}
            {isDoctor && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <Icons.Key />
                    <h3 className="text-sm font-semibold text-slate-800">Patient Access Request</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 mb-2">Request standard access or trigger an emergency override.</p>
                    <input 
                      className="block w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 sm:text-sm px-4 py-2.5 border outline-none"
                      placeholder="Patient Wallet (0x...)" 
                      value={doctorTargetPatient}
                      onChange={e => setDoctorTargetPatient(e.target.value)} 
                    />
                    <div className="flex gap-2">
                      <button onClick={handleRequestAccess} className="w-1/2 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all">Request Access</button>
                      <button onClick={handleEmergencyOverride} className="w-1/2 flex items-center justify-center gap-1 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-bold hover:bg-red-100 transition-all shadow-sm">
                        <Icons.Alert /> Override
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <Icons.Upload />
                    <h3 className="text-sm font-semibold text-slate-800">Clinical Data Upload</h3>
                  </div>
                  <form onSubmit={handleUpload} className="p-6 space-y-5">
                    <input className="block w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 sm:text-sm px-4 py-2.5 border outline-none" placeholder="Patient Address (0x...)" value={uploadPatientAddress} onChange={e => setUploadPatientAddress(e.target.value)} required />
                    <input className="block w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 sm:text-sm px-4 py-2.5 border outline-none" placeholder="Diagnosis / Notes" value={description} onChange={e => setDescription(e.target.value)} required />
                    <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg" onChange={e => setFile(e.target.files[0])} required />
                    <button type="submit" disabled={loading} className={`w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {loading ? <><span className="text-white"><Icons.Spinner /></span> Encrypting...</> : "Sign & Encrypt Payload"}
                    </button>
                  </form>
                </div>
              </>
            )}
            
            {/* PATIENT PERMISSION MANAGER */}
            {account && !isAdmin && !isDoctor && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <Icons.Key />
                  <h3 className="text-sm font-semibold text-slate-800">Security Dashboard</h3>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Pending Requests List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pending Requests ({pendingRequests.length})</h4>
                    {pendingRequests.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No pending requests.</p>
                    ) : (
                      <ul className="space-y-2">
                        {pendingRequests.map((docAddress, idx) => (
                          <li key={idx} className="flex justify-between items-center bg-orange-50 border border-orange-100 p-3 rounded-lg">
                            <span className="text-sm font-mono text-orange-800">{docAddress.slice(0, 6)}...{docAddress.slice(-4)}</span>
                            <button onClick={() => handleGrantAccess(docAddress)} className="text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white py-1.5 px-3 rounded shadow-sm">Approve</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <hr className="border-slate-100" />

                  {/* Active Doctors List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Authorized Doctors ({authorizedDoctors.length})</h4>
                    {authorizedDoctors.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No doctors have access to your vault.</p>
                    ) : (
                      <ul className="space-y-2">
                        {authorizedDoctors.map((docAddress, idx) => (
                          <li key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg">
                            <span className="text-sm font-mono text-slate-700">{docAddress.slice(0, 6)}...{docAddress.slice(-4)}</span>
                            <button onClick={() => handleRevokeAccess(docAddress)} className="text-xs font-bold bg-red-100 hover:bg-red-200 text-red-600 py-1.5 px-3 rounded border border-red-200 shadow-sm">Revoke</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* NEW: EMERGENCY AUDIT TRAIL */}
                  {emergencyLogs.length > 0 && (
                    <>
                      <hr className="border-slate-100" />
                      <div>
                        <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center">
                          <Icons.Alert /> Audit Log: Emergency Access
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">The following practitioners bypassed standard consent protocols.</p>
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {emergencyLogs.map((log, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-red-50 border border-red-100 p-3 rounded-lg">
                              <span className="text-sm font-mono text-red-800">{log.doctor.slice(0, 6)}...{log.doctor.slice(-4)}</span>
                              <span className="text-xs font-semibold text-red-600">
                                {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Patient Ledger</h3>
                  <p className="text-sm text-slate-500">Immutable encrypted history.</p>
                </div>
                <div className="flex gap-2">
                  <input className="hidden sm:block border-slate-200 rounded-lg px-4 py-2 border outline-none text-sm" placeholder="Search Address..." value={searchPatientAddress} onChange={e => setSearchPatientAddress(e.target.value)} />
                  <button onClick={fetchRecords} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Sync</button>
                </div>
              </div>

              <div className="p-6">
                {records.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">No records found. Click Sync to view.</div>
                ) : (
                  <ul className="space-y-4">
                    {records.map((r, i) => (
                      <li key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-5 hover:border-blue-300 transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">{new Date(Number(r.timestamp) * 1000).toLocaleDateString()}</span>
                          <div className="flex gap-3">
                            <button onClick={() => setActiveChat(r.fileHash)} className="flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-800">
                              <Icons.Chat /> Ask AI
                            </button>
                            <a href={`${BACKEND_URL}/download/${r.fileHash}`} target="_blank" rel="noreferrer" className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
                              <Icons.Document /> Decrypt Data
                            </a>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed"><strong className="text-slate-900 font-medium">Notes & AI Insight: </strong>{r.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Chat Slide-Out Sidebar */}
      {activeChat && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setActiveChat(null)}></div>
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center"><Icons.Chat /> Record AI Assistant</h3>
              <button onClick={() => setActiveChat(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 leading-relaxed border border-blue-100">
                I am actively reading the decrypted contents of CID: <span className="font-mono text-xs">{activeChat.slice(0,8)}...</span> Ask me anything about this medical file.
              </div>
              {chatLoading && (
                <div className="flex items-center text-sm text-slate-500 animate-pulse">
                  <span className="text-blue-600 mr-2"><Icons.Spinner /></span> Reading document securely...
                </div>
              )}
              {aiAnswer && !chatLoading && (
                <div className="bg-slate-100 p-4 rounded-xl text-sm text-slate-800 border border-slate-200 leading-relaxed shadow-sm">
                  <strong className="block mb-1 text-slate-900">AI Response:</strong>
                  {aiAnswer}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-white">
              <input 
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-3 shadow-sm"
                placeholder="e.g. Do I need to fast before this test?"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
              />
              <button 
                onClick={handleChatSubmit}
                disabled={chatLoading || !userQuestion.trim()}
                className="w-full bg-slate-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-300 transition-colors shadow-sm"
              >
                {chatLoading ? "Analyzing..." : "Ask Question"}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default App;