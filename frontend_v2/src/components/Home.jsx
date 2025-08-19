import React from "react";
import { useNavigate } from "react-router-dom";

const cardIcons = {
  ask: (
    <span className="text-6xl" role="img" aria-label="Ask a Question">❓</span>
  ),
  resources: (
    <span className="text-6xl" role="img" aria-label="Legal Resources">⚖️</span>
  ),
  upload: (
    <span className="text-6xl" role="img" aria-label="Upload Document">📝</span>
  ),
};

export default function Home() {
  const navigate = useNavigate();
  const cards = [
    {
      title: 'Ask a Simple Question',
      desc: 'Get quick answers to your legal questions.',
      icon: cardIcons.ask,
      route: '/ask',
    },
    {
      title: 'Explore Legal Resources',
      desc: 'Access a wealth of legal information and resources.',
      icon: cardIcons.resources,
      route: '/resources',
    },
    {
      title: 'Upload Legal Documents',
      desc: 'Upload your documents for expert review.',
      icon: cardIcons.upload,
      route: '/upload',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-neutral-50 flex flex-col" style={{ fontFamily: 'Public Sans, Noto Sans, sans-serif' }}>
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 md:px-10 py-3 bg-white">
        <div className="flex items-center gap-4 text-[#141414]">
          <div className="size-4">{/* SVG logo here if needed */}</div>
          <h2 className="text-[#141414] text-lg font-bold leading-tight tracking-[-0.015em]">AI Legal Assistant</h2>
        </div>
        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#ededed] text-[#141414] text-sm font-bold leading-normal tracking-[0.015em]">
          <span className="truncate">Log In</span>
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center w-full py-10 px-2">
        <div className="w-full max-w-4xl mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2"><span role="img" aria-label="scales">⚖️</span> Welcome to AI Legal Assistant</h1>
          <p className="text-neutral-600 text-lg">Your intelligent legal companion for understanding legal documents, getting preliminary guidance, and navigating the Indian legal system. Ask questions in Hindi or English!</p>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">How can I help you today?</h2>
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col items-center justify-between cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition bg-white overflow-hidden group p-8 min-h-[320px] border border-neutral-200"
              onClick={() => navigate(card.route)}
              tabIndex={0}
              role="button"
              onKeyPress={e => { if (e.key === 'Enter') navigate(card.route); }}
            >
              <div className="mb-6">{card.icon}</div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold mb-2 text-center">{card.title}</h2>
                <p className="text-neutral-500 mb-4 text-center">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
