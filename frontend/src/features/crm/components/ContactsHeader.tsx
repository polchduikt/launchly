import React from 'react';

interface ContactsHeaderProps {
  onCreateContact: () => void;
  onImport: () => void;
}

export const ContactsHeader: React.FC<ContactsHeaderProps> = ({ onCreateContact, onImport }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contacts</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateContact}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          Create New Contact
        </button>
        <button
          onClick={onImport}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          Import
        </button>
      </div>
    </header>
  );
};
