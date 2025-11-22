import React, { useState, useEffect, useMemo } from 'react';

// Import Components
import AuthPage from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SnippetsPage } from './pages/SnippetsPage';
import { StarredPage } from './pages/StarredPage';
import { FolderViewPage } from './pages/FolderViewPage';
import { Navbar } from './components/Navbar';
import { Notification } from './components/Notification';
import { Modal } from './components/Modal';
import { SnippetViewModal } from './components/SnippetViewModal';
import { AiChatModal } from './components/AiChatModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SparklesIcon } from './components/Icons';

const API_URL = 'http://localhost:5000/api';

export default function App() {
    const [page, setPage] = useState('login');
    const [token, setToken] = useState(sessionStorage.getItem('authToken'));
    const [userData, setUserData] = useState({ folders: [], standaloneSnippets: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [folderHistory, setFolderHistory] = useState([]);
    const currentFolder = folderHistory.length > 0 ? folderHistory[folderHistory.length - 1] : null;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('');
    const [targetFolderId, setTargetFolderId] = useState(null);
    const [viewingSnippet, setViewingSnippet] = useState(null);
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [folderName, setFolderName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [aiChatSnippet, setAiChatSnippet] = useState(null);

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, message: '' });

    const findFolderById = (folders, id) => {
        for (const folder of folders) {
            if (folder.id === id) return folder;
            if (folder.subfolders && folder.subfolders.length > 0) {
                const found = findFolderById(folder.subfolders, id);
                if (found) return found;
            }
        }
        return null;
    };

    const apiFetch = async (endpoint, method = 'GET', body = null) => {
        const headers = { 'Content-Type': 'application/json' };
        const currentToken = sessionStorage.getItem('authToken');
        if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (response.status === 204) return null;
        
        let data;
        try {
            data = await response.json();
        } catch (error) {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) handleLogout();
                throw new Error(`Request failed with status ${response.status}`);
            }
            // If response was OK but not JSON, return null or throw
             console.warn("Received non-JSON response from API", error);
             return null;
        }

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) handleLogout();
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        return data;
    };

    const handleGoogleLogin = async (googleResponse) => {
        try {
            const data = await apiFetch('/auth/google', 'POST', { 
                credential: googleResponse.credential 
            });
            sessionStorage.setItem('authToken', data.token);
            setToken(data.token);
            await fetchUserData();
            setPage('home');
            showNotification(data.message, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const callGeminiApi = async (prompt) => {
        setIsAiLoading(true);
        try {
            
            const apiKey = "API_KEY"; 
            
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("Gemini API error");
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("AI did not return a valid response.");
            return text.replace(/```[\w\s]*\n/g, '').replace(/```/g, '').trim();
        } catch (error) {
            showNotification(error.message, 'error');
            return null;
        } finally {
            setIsAiLoading(false);
        }
    };


    useEffect(() => {
        const currentToken = sessionStorage.getItem('authToken');
        if (currentToken) {
            setToken(currentToken);
            fetchUserData();
            setPage('home');
        }
        setIsLoading(false);
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const fetchUserData = async () => {
        try {
            const data = await apiFetch('/data');
            setUserData(data);
            return data;
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            return null;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = await apiFetch('/auth/login', 'POST', { email, password });
            sessionStorage.setItem('authToken', data.token);
            setToken(data.token);
            await fetchUserData();
            setPage('home');
            showNotification(data.message, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const data = await apiFetch('/auth/signup', 'POST', { email, password });
            showNotification(data.message, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('authToken');
        setToken(null);
        setUserData({ folders: [], standaloneSnippets: [] });
        setPage('login');
        setFolderHistory([]);
        setEmail('');
        setPassword('');
    };
    
    const resetForm = () => {
        setTitle(''); setCode(''); setFolderName(''); setAiPrompt(''); setIsModalOpen(false);
    };
    
    const handleAddFolder = async () => {
        if (!folderName.trim()) return;
        
        // Optimistic Update
        const tempId = Date.now();
        const newFolder = { id: tempId, name: folderName, parent_id: targetFolderId, subfolders: [], snippets: [], is_starred: false };
        
        const previousUserData = { ...userData };
        
        // Helper to insert into tree
        const insertIntoTree = (folders) => {
            if (!targetFolderId) return [...folders, newFolder];
            return folders.map(folder => {
                if (folder.id === targetFolderId) {
                    return { ...folder, subfolders: [...folder.subfolders, newFolder] };
                }
                return { ...folder, subfolders: insertIntoTree(folder.subfolders) };
            });
        };

        const updatedFolders = insertIntoTree(userData.folders || []);
        setUserData({ ...userData, folders: updatedFolders });
        resetForm();

        try {
            const createdFolder = await apiFetch('/folders', 'POST', { name: folderName, parentId: targetFolderId });
            
            // Replace temp ID with real ID
            const replaceTempId = (folders) => {
                return folders.map(folder => {
                    if (folder.id === tempId) return createdFolder;
                    return { ...folder, subfolders: replaceTempId(folder.subfolders) };
                });
            };
            
            setUserData(prev => ({ ...prev, folders: replaceTempId(prev.folders) }));
            showNotification("Folder created successfully!", "success");
            
            // Update history if needed
            if (currentFolder) {
                 // This is complex to update history perfectly without refetch, 
                 // but for now let's rely on the fact that we updated the main tree.
                 // Ideally we should update the history stack too if we are viewing the parent.
            }

        } catch (error) {
            setUserData(previousUserData);
            showNotification(error.message, 'error');
        }
    };

    const handleAddSnippet = async () => {
        if (!title.trim() || !code.trim()) return;

        // Optimistic Update
        const tempId = Date.now();
        const newSnippet = { id: tempId, title, code, folder_id: targetFolderId, is_starred: false };
        const previousUserData = { ...userData };

        if (targetFolderId) {
            const insertIntoTree = (folders) => {
                return folders.map(folder => {
                    if (folder.id === targetFolderId) {
                        return { ...folder, snippets: [newSnippet, ...folder.snippets] };
                    }
                    return { ...folder, subfolders: insertIntoTree(folder.subfolders) };
                });
            };
            setUserData({ ...userData, folders: insertIntoTree(userData.folders || []) });
        } else {
            setUserData({ ...userData, standaloneSnippets: [newSnippet, ...(userData.standaloneSnippets || [])] });
        }
        
        resetForm();

        try {
            const createdSnippet = await apiFetch('/snippets', 'POST', { title, code, folderId: targetFolderId });
            
            // Replace temp ID with real ID
            if (targetFolderId) {
                 const replaceTempId = (folders) => {
                    return folders.map(folder => {
                        if (folder.id === targetFolderId) {
                            return { 
                                ...folder, 
                                snippets: folder.snippets.map(s => s.id === tempId ? createdSnippet : s) 
                            };
                        }
                        return { ...folder, subfolders: replaceTempId(folder.subfolders) };
                    });
                };
                setUserData(prev => ({ ...prev, folders: replaceTempId(prev.folders) }));
            } else {
                setUserData(prev => ({ 
                    ...prev, 
                    standaloneSnippets: prev.standaloneSnippets.map(s => s.id === tempId ? createdSnippet : s) 
                }));
            }
            showNotification("Snippet created successfully!", "success");
        } catch (error) {
            setUserData(previousUserData);
            showNotification(error.message, 'error');
        }
    };

    const handleUpdateSnippet = async (snippetId, updatedTitle, updatedCode) => {
        try {
            await apiFetch(`/snippets/${snippetId}`, 'PUT', { title: updatedTitle, code: updatedCode });
            await fetchUserData();
            showNotification("Snippet updated successfully!", "success");
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };
    
    const handleFolderRename = async (folderId, newName) => {
        try {
            await apiFetch(`/folders/${folderId}`, 'PUT', { name: newName });
            const newData = await fetchUserData();
            if (newData && currentFolder) {
                const updatedFolder = findFolderById(newData.folders, currentFolder.id);
                if (updatedFolder) {
                    const newHistory = [...folderHistory];
                    newHistory[newHistory.length - 1] = updatedFolder;
                    setFolderHistory(newHistory);
                }
            }
            showNotification("Folder renamed successfully!", "success");
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleDelete = (type, id) => {
        setConfirmModal({
            isOpen: true,
            message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
            onConfirm: () => {
                confirmDelete(type, id);
                setConfirmModal({ isOpen: false, onConfirm: null, message: '' });
            }
        });
    };
    
    const confirmDelete = async (type, id) => {
        try {
            await apiFetch(`/${type}s/${id}`, 'DELETE');
            const newData = await fetchUserData();
            if (type === 'folder' && currentFolder && currentFolder.id === id) {
                handleBack();
            } else if (newData && currentFolder) {
                const updatedFolder = findFolderById(newData.folders, currentFolder.id);
                if (updatedFolder) {
                    const newHistory = [...folderHistory];
                    newHistory[newHistory.length - 1] = updatedFolder;
                    setFolderHistory(newHistory);
                } else {
                    handleBack();
                }
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleFolderSelect = (folder) => {
        setFolderHistory([...folderHistory, folder]);
    };

    const handleBack = () => {
        const newHistory = [...folderHistory];
        newHistory.pop();
        setFolderHistory(newHistory);
    };
    
    const handleGenerateCode = async () => {
        if (!aiPrompt.trim()) return;
        const fullPrompt = `${aiPrompt}. Only return the raw code, with no explanation or markdown formatting.`;
        const generatedCode = await callGeminiApi(fullPrompt);
        if (generatedCode) {
            setCode(generatedCode);
            if (!title) setTitle(aiPrompt.substring(0, 50));
        }
    };

    const handleAiSnippetAction = async (action, codeToProcess) => {
        let prompt = '';
        switch(action) {
            case 'check':
                // New prompt to ask the AI to identify the erroneous line
                prompt = `Analyze the following code snippet and identify the single line that contains the most significant error or bug. Return ONLY that single line of code, with no explanation, markdown, or any other text.\n\n${codeToProcess}`;
                break;
            case 'correct':
                prompt = `Correct the following code snippet. Fix any bugs or errors. Only return the raw, corrected code with no explanation or markdown formatting.\n\n${codeToProcess}`;
                break;
            case 'add_comments':
                prompt = `Add clear and descriptive comments to the following code snippet where necessary. Do not change the code logic. Only return the raw, updated code with no explanation or markdown formatting.\n\n${codeToProcess}`;
                break;
            default:
                return null;
        }
        return await callGeminiApi(prompt);
    };

    const handleAiChatQuery = async (userPrompt, code) => {
        const fullPrompt = `You are a helpful coding assistant. A user has a code snippet and a question about it. Provide a concise and helpful answer.\n\nCode Snippet:\n---\n${code}\n---\n\nUser's Question: "${userPrompt}"`;
        return await callGeminiApi(fullPrompt); // Use fullPrompt, not prompt
    };
    
    const openModal = (mode, id = null) => {
        setModalMode(mode);
        setTargetFolderId(id);
        setIsModalOpen(true);
    };

    // Modified filteredData useMemo hook
    const filteredData = useMemo(() => {
        if (!searchTerm) return userData;
        const lowerTerm = searchTerm.toLowerCase();
        
        const filterSnippets = (snippets) => snippets.filter(s => s.title.toLowerCase().includes(lowerTerm) || s.code.toLowerCase().includes(lowerTerm));
        
        const filterFolders = (folders) => {
            return folders.map(folder => {
                const matchesName = folder.name.toLowerCase().includes(lowerTerm);
                const filteredSubfolders = filterFolders(folder.subfolders);
                const filteredSnippets = filterSnippets(folder.snippets); // Use the filterSnippets helper
                
                if (matchesName || filteredSubfolders.length > 0 || filteredSnippets.length > 0) {
                    return { ...folder, subfolders: filteredSubfolders, snippets: filteredSnippets };
                }
                return null;
            }).filter(Boolean);
        };

        const filteredStandalone = userData.standaloneSnippets?.filter(s => s.title.toLowerCase().includes(lowerTerm) || s.code.toLowerCase().includes(lowerTerm)) || [];
        const filteredFoldersResult = filterFolders(userData.folders || []);

        return { standaloneSnippets: filteredStandalone, folders: filteredFoldersResult };
    }, [searchTerm, userData]);


    if (isLoading) return <div className="text-center text-xl text-white">Loading...</div>;

    const handleToggleStar = async (type, id) => {
        
        // 1. Optimistic Update
        const previousUserData = { ...userData };
        
        const toggleInTree = (folders) => {
            return folders.map(folder => {
                if (type === 'folder' && folder.id === id) {
                    return { ...folder, is_starred: !folder.is_starred };
                }
                const updatedSnippets = folder.snippets.map(snippet => {
                    if (type === 'snippet' && snippet.id === id) {
                        return { ...snippet, is_starred: !snippet.is_starred };
                    }
                    return snippet;
                });
                const updatedSubfolders = toggleInTree(folder.subfolders);
                return { ...folder, snippets: updatedSnippets, subfolders: updatedSubfolders };
            });
        };

        const updatedFolders = toggleInTree(userData.folders || []);
        
        let updatedStandaloneSnippets = userData.standaloneSnippets || [];
        if (type === 'snippet') {
            updatedStandaloneSnippets = updatedStandaloneSnippets.map(snippet => 
                snippet.id === id ? { ...snippet, is_starred: !snippet.is_starred } : snippet
            );
        }

        setUserData({ ...userData, folders: updatedFolders, standaloneSnippets: updatedStandaloneSnippets });

        // 2. API Call
        try {
            const endpoint = type === 'folder' ? `/api/folders/${id}/star` : `/api/snippets/${id}/star`;
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                console.error('Failed to toggle star', await response.text());
                // Revert on failure
                setUserData(previousUserData);
                showNotification("Failed to update star status", "error");
            } else {
                 // Optional: Background refresh to ensure consistency, but not strictly needed if logic is correct
                 // await fetchUserData(); 
            }
        } catch (error) {
            console.error('Error toggling star:', error);
            // Revert on error
            setUserData(previousUserData);
            showNotification("Network error updating star status", "error");
        }
    };

    const renderPage = () => {
        if (currentFolder) {
            const parentFolder = folderHistory.length > 1 ? folderHistory[folderHistory.length - 2] : null;
            return <FolderViewPage 
                        folder={currentFolder} 
                        parentFolder={parentFolder}
                        onBack={handleBack}
                        onFolderSelect={handleFolderSelect}
                        onFolderAdd={(parentId) => openModal('addFolder', parentId)} 
                        onFolderDelete={(id) => handleDelete('folder', id)} 
                        onFolderRename={handleFolderRename}
                        onSnippetAdd={(folderId) => openModal('addSnippetToFolder', folderId)} 
                        onSnippetDelete={(snippetId) => handleDelete('snippet', snippetId)} 
                        onSnippetCopy={(code) => navigator.clipboard.writeText(code)} 
                        onSnippetExpand={setViewingSnippet} 
                        onAiChat={setAiChatSnippet}
                        onToggleStar={(id) => handleToggleStar('folder', id)}
                        onSnippetToggleStar={(id) => handleToggleStar('snippet', id)}
                    />;
        }

        switch(page) {
            case 'home':
                return <HomePage 
                            userData={userData} 
                            onSnippetCopy={(code) => navigator.clipboard.writeText(code)}
                            onDelete={handleDelete}
                            onExpand={setViewingSnippet}
                            onAiChat={setAiChatSnippet}
                            setPage={setPage} 
                            onFolderSelect={handleFolderSelect}
                            onToggleStar={handleToggleStar}
                        />;

            case 'projects':
                return <ProjectsPage 
                            userData={filteredData} 
                            onFolderSelect={handleFolderSelect} 
                            onFolderAdd={(parentId) => openModal('addFolder', parentId)} 
                            onFolderDelete={(id) => handleDelete('folder', id)} 
                            onFolderRename={handleFolderRename} 
                            onToggleStar={(id) => handleToggleStar('folder', id)}
                        />;
            case 'snippets':
                return <SnippetsPage 
                            snippets={filteredData.standaloneSnippets || []} 
                            onCopy={(code) => navigator.clipboard.writeText(code)} 
                            onDelete={(id) => handleDelete('snippet', id)} 
                            onExpand={setViewingSnippet} 
                            onAiChat={setAiChatSnippet} 
                            onAddSnippet={() => openModal('addSnippet')} 
                            onToggleStar={(id) => handleToggleStar('snippet', id)}
                        />;
            case 'starred':
                // Flatten all snippets for the starred page if needed, or just pass the raw lists
                // For now, let's gather all folders and snippets recursively or just use the top-level ones?
                // The requirement implies seeing ALL starred items. 
                // Let's pass the full userData and let StarredPage filter, or filter here.
                // Actually, userData.folders is a tree. We need to flatten it to find all starred folders/snippets?
                // Or just rely on the API returning them?
                // The current API returns a tree. 
                // Let's implement a helper to flatten the tree for the StarredPage, or update the API.
                // For simplicity, let's traverse the tree in StarredPage or here.
                // Let's do a quick traversal here to pass flat lists of ALL folders and snippets to StarredPage.
                
                const getAllFolders = (nodes) => {
                    let all = [];
                    nodes.forEach(node => {
                        all.push(node);
                        if (node.subfolders) all = all.concat(getAllFolders(node.subfolders));
                    });
                    return all;
                };

                const getAllSnippets = (nodes) => {
                    let all = [];
                    nodes.forEach(node => {
                        if (node.snippets) all = all.concat(node.snippets);
                        if (node.subfolders) all = all.concat(getAllSnippets(node.subfolders));
                    });
                    return all;
                };

                const allFolders = getAllFolders(userData.folders || []);
                let allSnippets = getAllSnippets(userData.folders || []);
                if (userData.standaloneSnippets) {
                    allSnippets = allSnippets.concat(userData.standaloneSnippets);
                }

                return <StarredPage 
                            folders={allFolders}
                            snippets={allSnippets}
                            onFolderSelect={handleFolderSelect}
                            onFolderDelete={(id) => handleDelete('folder', id)}
                            onFolderRename={handleFolderRename}
                            onSnippetCopy={(code) => navigator.clipboard.writeText(code)}
                            onSnippetDelete={(id) => handleDelete('snippet', id)}
                            onSnippetExpand={setViewingSnippet}
                            onAiChat={setAiChatSnippet}
                            onToggleStar={handleToggleStar}
                        />;

            default:
                return <HomePage userData={userData} />;
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        setFolderHistory([]); // Reset folder view when switching tabs
    };

    return (
        <div className="min-h-screen bg-vibrant-gradient text-text font-sans selection:bg-primary selection:text-white">
            {token && <Navbar onLogout={handleLogout} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setPage={handlePageChange} page={page} />}
              <main>
                {!token ? (
                    <AuthPage 
                        onLogin={handleLogin} 
                        onSignup={handleSignup} 
                        onGoogleLogin={handleGoogleLogin} 
                        email={email} 
                        password={password} 
                        setEmail={setEmail} 
                        setPassword={setPassword} 
                    />
                ) : (
                    renderPage()
                )}
            </main>
            <Notification message={notification.message} type={notification.type} />
            <Modal isOpen={isModalOpen} onClose={resetForm}>
                {modalMode === 'addFolder' && (
                    <div className="p-1">
                        <h3 className="text-xl font-bold mb-4 text-warning">New Folder</h3>
                        <input 
                            type="text" 
                            value={folderName} 
                            onChange={e => setFolderName(e.target.value)} 
                            placeholder="Folder Name" 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                            className="w-full p-3 bg-bg-lighter border border-border rounded-lg mb-4 text-white focus:outline-none focus:ring-2 focus:ring-warning transition-all" 
                        />
                        <button 
                            onClick={handleAddFolder} 
                            className="w-full p-3 bg-warning text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-warning/20"
                        >
                            Create Folder
                        </button>
                    </div>
                )}
                {(modalMode === 'addSnippet' || modalMode === 'addSnippetToFolder') && (
                     <div className="p-1">
                        <h3 className="text-xl font-bold mb-4 text-accent">New Snippet</h3>
                        <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-border/50">
                            <label className="block text-sm font-bold mb-2 text-secondary">Generate with AI</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={aiPrompt} 
                                    onChange={e => setAiPrompt(e.target.value)} 
                                    placeholder="e.g., a python function to sort a list" 
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateCode()}
                                    className="w-full p-2 bg-bg-lighter border border-border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-secondary" 
                                />
                                <button 
                                    onClick={handleGenerateCode} 
                                    disabled={isAiLoading} 
                                    className="px-4 bg-secondary text-white font-bold rounded-md flex items-center hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SparklesIcon className="w-5 h-5 mr-2"/> {isAiLoading ? '...' : 'Go'}
                                </button>
                            </div>
                        </div>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="Snippet Title" 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSnippet()}
                            className="w-full p-3 bg-bg-lighter border border-border rounded-lg mb-4 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all" 
                        />
                        <textarea 
                            value={code} 
                            onChange={e => setCode(e.target.value)} 
                            placeholder="Enter code or generate with AI..." 
                            rows="10" 
                            className="w-full p-3 bg-bg border border-border rounded-lg mb-4 font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                        ></textarea>
                        <button 
                            onClick={handleAddSnippet} 
                            className="w-full p-3 bg-accent text-white font-bold rounded-lg hover:bg-cyan-600 transition-colors shadow-lg hover:shadow-accent/20"
                        >
                            Save Snippet
                        </button>
                    </div>
                )}
            </Modal>
            <SnippetViewModal snippet={viewingSnippet} isOpen={!!viewingSnippet} onClose={() => setViewingSnippet(null)} onCopy={(code) => navigator.clipboard.writeText(code)} onUpdate={handleUpdateSnippet} onAiAction={handleAiSnippetAction} isAiLoading={isAiLoading} />
            
            {/* This line renders the new AI Chat Modal */}
            <AiChatModal 
                snippet={aiChatSnippet} 
                isOpen={!!aiChatSnippet} 
                onClose={() => setAiChatSnippet(null)} 
                onSendQuery={handleAiChatQuery} 
                isAiLoading={isAiLoading} 
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                onClose={() => setConfirmModal({ isOpen: false, onConfirm: null, message: '' })} 
                onConfirm={confirmModal.onConfirm} 
                message={confirmModal.message} 
            />
        </div>
    );
}


  



