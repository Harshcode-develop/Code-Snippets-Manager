import React from 'react';
import { Folder } from '../components/Folder';
import { PlusIcon } from '../components/Icons';

export const ProjectsPage = ({ userData, onFolderSelect, onFolderAdd, onFolderDelete, onFolderRename, onToggleStar }) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-text">Projects</h1>
                <button onClick={() => onFolderAdd(null)} className="flex items-center gap-2 px-4 py-2 bg-warning text-bg font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-warning/20">
                    <PlusIcon className="w-5 h-5" /> New Project Folder
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userData.folders && userData.folders.length > 0 ? (
                    userData.folders.map(folder => (
                        <Folder 
                            key={folder.id} 
                            folder={folder} 
                            onFolderSelect={onFolderSelect}
                            onFolderDelete={onFolderDelete}
                            onFolderRename={onFolderRename}
                            onToggleStar={onToggleStar}
                        />
                    ))
                ) : (
                    <p className="text-center text-text-muted mt-12 text-lg col-span-full">
                        No projects found. Create one to get started.
                    </p>
                )}
            </div>
        </div>
    );
};
