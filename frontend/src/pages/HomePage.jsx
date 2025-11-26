import React, { useState, useMemo } from 'react';
import { SnippetCard } from '../components/SnippetCard';
import { Folder } from '../components/Folder';
import { SearchIcon } from '../components/Icons';

export const HomePage = ({ userData, onSnippetCopy, onDelete, onExpand, onAiChat, setPage, onFolderSelect, onToggleStar }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showRecents, setShowRecents] = useState(true);

    const totalSnippets = (userData.standaloneSnippets?.length || 0) + (userData.folders?.reduce((acc, folder) => acc + folder.snippets.length, 0) || 0);

    const allSnippets = useMemo(() => {
        const snippetsFromFolders = (userData.folders || []).flatMap(folder => 
            folder.snippets ? folder.snippets.map(s => ({...s, folderName: folder.name})) : []
        );
        return [
            ...(userData.standaloneSnippets || []),
            ...snippetsFromFolders
        ];
    }, [userData]);

    // This logic ensures only the 4 most recent snippets are ever shown
    const recentSnippets = useMemo(() => 
        allSnippets.sort((a, b) => b.id - a.id).slice(0, 4), 
        [allSnippets]
    );

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) {
            return null;
        }
        const lowerCaseTerm = searchTerm.toLowerCase();

        const foundSnippets = allSnippets.filter(snippet => 
            snippet.title.toLowerCase().includes(lowerCaseTerm) || 
            snippet.code.toLowerCase().includes(lowerCaseTerm)
        );

        const foundFolders = (userData.folders || []).filter(folder => 
            folder.name.toLowerCase().includes(lowerCaseTerm)
        );

        return { snippets: foundSnippets, folders: foundFolders };
    }, [searchTerm, allSnippets, userData.folders]);
    const handleFolderClick = (folder) => {
        setPage('projects');
        onFolderSelect(folder);
    };

    return (
        <div className="animate-fade-in-up pb-10 min-h-screen">
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[calc(10vh-8px)] pt-0.5">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 animate-color-cycle bg-clip-text text-transparent bg-linear-to-r from-primary via-secondary to-accent tracking-tight drop-shadow-2xl pt-10">
                    Welcome, Coder.
                </h1>
                <p className="text-lg text-text-muted max-w-xl mb-8 leading-relaxed font-light">
                    Your personal code snippets manager. All your valuable snippets, one workspace.
                </p>
                <div className="flex gap-12 pb-1">
                    <div className="text-center group hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl font-bold text-warning block mb-1 drop-shadow-lg">{userData.folders?.length || 0}</span>
                        <span className="text-xs text-text-muted uppercase tracking-widest font-semibold">Projects</span>
                    </div>
                    <div className="text-center group hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl font-bold text-accent block mb-1 drop-shadow-lg">{totalSnippets}</span>
                        <span className="text-xs text-text-muted uppercase tracking-widest font-semibold">Snippets</span>
                    </div>
                </div>
            </div>

            <div className="relative max-w-xl mx-auto mb-10 px-4 group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <SearchIcon className="w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                    type="text"
                    className="w-full bg-bg-lighter/50 backdrop-blur-md border border-border rounded-2xl py-3 pl-14 pr-8 text-lg text-text text-center placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-lg hover:shadow-primary/5"
                    placeholder="Search all snippets and folders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {searchResults ? (
                <div className="max-w-7xl mx-auto px-4 pb-12">
                    <p className="text-text-muted mb-6">
                        Found {searchResults.folders.length} folder(s) and {searchResults.snippets.length} snippet(s).
                    </p>
                    {searchResults.folders.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {searchResults.folders.map(folder => (
                                <div key={folder.id} onClick={() => handleFolderClick(folder)}>
                                     <Folder 
                                        folder={folder} 
                                        onFolderSelect={() => handleFolderClick(folder)} 
                                        onToggleStar={(id) => onToggleStar('folder', id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {searchResults.snippets.map(snippet => (
                            <SnippetCard 
                                key={snippet.id} 
                                snippet={snippet} 
                                onCopy={onSnippetCopy} 
                                onDelete={() => onDelete('snippet', snippet.id)} 
                                onExpand={onExpand} 
                                onAiChat={onAiChat} 
                                onToggleStar={(id) => onToggleStar('snippet', id)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                showRecents && recentSnippets.length > 0 && (
                    <div className='max-w-7xl mx-auto px-4'>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-text flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Recent Activity
                            </h2>
                            <button onClick={() => setShowRecents(false)} className="text-xs text-text-muted hover:text-error transition-colors font-medium px-3 py-1 border border-text-muted/30 rounded-lg hover:border-error/50">Clear</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {recentSnippets.map(snippet => (
                                <SnippetCard 
                                    key={snippet.id} 
                                    snippet={snippet} 
                                    onCopy={onSnippetCopy} 
                                    onDelete={() => onDelete('snippet', snippet.id)} 
                                    onExpand={onExpand} 
                                    onAiChat={onAiChat} 
                                    onToggleStar={(id) => onToggleStar('snippet', id)}
                                />
                            ))}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};