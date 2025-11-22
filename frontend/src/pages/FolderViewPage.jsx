import React from 'react';
import { Folder } from '../components/Folder';
import { SnippetCard } from '../components/SnippetCard';
import { PlusIcon, BackArrowIcon } from '../components/Icons';

export const FolderViewPage = ({ folder, parentFolder, onBack, onFolderSelect, onFolderAdd, onFolderDelete, onFolderRename, onSnippetAdd, onSnippetDelete, onSnippetCopy, onSnippetExpand, onAiChat, onToggleStar, onSnippetToggleStar }) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
            <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6 group">
                <BackArrowIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                {parentFolder ? `Back to ${parentFolder.name}` : 'Back to All Projects'}
            </button>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-warning">{folder.name}</h1>
                <div className="flex gap-4">
                    <button onClick={() => onFolderAdd(folder.id)} className="flex items-center gap-2 px-4 py-2 bg-warning text-bg font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-warning/20">
                        <PlusIcon className="w-5 h-5" /> New Subfolder
                    </button>
                    <button onClick={() => onSnippetAdd(folder.id)} className="flex items-center gap-2 px-4 py-2 bg-accent text-bg font-bold rounded-lg hover:bg-cyan-400 transition-colors shadow-lg hover:shadow-accent/20">
                        <PlusIcon className="w-5 h-5" /> New Snippet
                    </button>
                </div>
            </div>

            {/* Render Subfolders */}
            {folder.subfolders && folder.subfolders.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-semibold text-text-muted mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-warning rounded-full"></span>
                        Subfolders
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {folder.subfolders.map(subfolder => (
                            <Folder 
                                key={subfolder.id}
                                folder={subfolder}
                                onFolderSelect={onFolderSelect} // Allow clicking into subfolders
                                onFolderDelete={onFolderDelete}
                                onFolderRename={onFolderRename}
                                onToggleStar={onToggleStar}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Render Snippets */}
            {folder.snippets && folder.snippets.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-text-muted mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent rounded-full"></span>
                        Snippets
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {folder.snippets.map(snippet => (
                            <SnippetCard 
                                key={snippet.id} 
                                snippet={snippet} 
                                onCopy={onSnippetCopy} 
                                onDelete={() => onSnippetDelete(snippet.id)} 
                                onExpand={onSnippetExpand} 
                                onAiChat={onAiChat} 
                                onToggleStar={onSnippetToggleStar}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
