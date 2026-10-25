import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  formSlug: string;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({
  isOpen,
  onClose,
  formSlug,
}) => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState('750');

  const origin = window.location.origin;
  const embedUrl = `${origin}/forms/${formSlug}?embedded=true`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="${height}" frameborder="0" marginheight="0" marginwidth="0" style="border: none; border-radius: 12px; max-width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.06);" title="FormCraft Embed">Loading…</iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    success('Embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Embed Form on Your Website" maxWidth="2xl">
      <div className="space-y-5">
        <p className="text-sm text-gray-500">
          Copy and paste this HTML snippet into any page, CMS (WordPress, Webflow, Shopify), or custom web app to embed this live form seamlessly.
        </p>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-700">Height (px):</label>
          <input
            type="number"
            value={height}
            onChange={e => setHeight(e.target.value)}
            className="w-24 px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
          />
        </div>

        {/* Code Snippet Box */}
        <div className="relative">
          <textarea
            readOnly
            rows={4}
            value={iframeCode}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-800 outline-none select-all"
          />
          <button
            type="button"
            onClick={copyToClipboard}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Live Preview Frame */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
            Embed Preview
          </span>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-gray-50 h-64">
            <iframe
              src={embedUrl}
              title="Live Preview"
              className="w-full h-full border-none pointer-events-none transform scale-95 origin-top"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Open preview standalone</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
