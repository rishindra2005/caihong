// Editor toolbar with:
// - LaTeX specific tools
// - Table insertion
// - Graph insertion 
// - Image insertion
// - Collaboration tools

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  TableCellsIcon,
  PhotoIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CalculatorIcon,
  ListBulletIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface ToolBarProps {
  onInsertTable: (rows: number, cols: number) => void;
  onInsertImage: (url: string) => void;
  onInsertEquation: (equation: string) => void;
  onExportPDF: () => void;
  saveStatus?: 'idle' | 'saved' | 'saving' | 'error' | 'disconnected';
}

interface DialogState {
  table: boolean;
  equation: boolean;
}

const ToolBar: React.FC<ToolBarProps> = ({
  onInsertTable,
  onInsertImage,
  onInsertEquation,
  onExportPDF,
  saveStatus = 'saved',
}) => {
  const [dialogOpen, setDialogOpen] = useState<DialogState>({
    table: false,
    equation: false,
  });
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3 });

  const insertEnvironment = (type: string) => {
    const environments: Record<string, string> = {
      document: '\\begin{document}\n\n\\end{document}',
      figure: '\\begin{figure}[h]\n  \\centering\n  \\caption{}\n\\end{figure}',
      itemize: '\\begin{itemize}\n  \\item\n\\end{itemize}',
      enumerate: '\\begin{enumerate}\n  \\item\n\\end{enumerate}',
      equation: '\\begin{equation}\n  \n\\end{equation}',
      align: '\\begin{align*}\n  \n\\end{align*}',
    };
    return environments[type] || '';
  };

  const renderSaveStatus = () => {
    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        </div>
      );
    }
    // Show nothing for all other statuses
    return null;
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2 border-b border-gray-200 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-2">
        {/* Document Structure */}
        <div className="flex items-center gap-1 border-r pr-2">
          <button
            onClick={() => onInsertEquation(insertEnvironment('document'))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Document"
          >
            <DocumentTextIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2">
          <button
            onClick={() => onInsertEquation(insertEnvironment('itemize'))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Bullet List"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onInsertEquation(insertEnvironment('enumerate'))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Numbered List"
          >
            <span className="font-mono">1.</span>
          </button>
        </div>

        {/* Math */}
        <div className="flex items-center gap-1 border-r pr-2">
          <button
            onClick={() => onInsertEquation(insertEnvironment('equation'))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Equation"
          >
            <CalculatorIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onInsertEquation(insertEnvironment('align'))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Aligned Equations"
          >
            <CodeBracketIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tables, Figures, and Charts */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDialogOpen({ ...dialogOpen, table: true })}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Insert Table"
          >
            <TableCellsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onInsertEquation(insertEnvironment('figure'))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Insert Figure"
          >
            <PhotoIcon className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Insert Chart"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Save Status */}
      <div className="flex items-center px-2">
        {renderSaveStatus()}
      </div>

      {/* Table Dialog */}
      <Transition show={dialogOpen.table} as={Fragment}>
        <Dialog 
          onClose={() => setDialogOpen({ ...dialogOpen, table: false })}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg p-6 w-64">
              <Dialog.Title className="text-lg font-medium mb-4">Insert Table</Dialog.Title>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rows</label>
                  <input
                    type="number"
                    min="1"
                    value={tableConfig.rows}
                    onChange={(e) => setTableConfig({ ...tableConfig, rows: parseInt(e.target.value) })}
                    className="w-full border rounded p-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Columns</label>
                  <input
                    type="number"
                    min="1"
                    value={tableConfig.cols}
                    onChange={(e) => setTableConfig({ ...tableConfig, cols: parseInt(e.target.value) })}
                    className="w-full border rounded p-1"
                  />
                </div>

                <button
                  onClick={() => {
                    onInsertTable(tableConfig.rows, tableConfig.cols);
                    setDialogOpen({ ...dialogOpen, table: false });
                  }}
                  className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600"
                >
                  Insert
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ToolBar;
