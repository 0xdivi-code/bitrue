import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f7f8fa] px-4 text-center">
      <div className="num text-[64px] font-extrabold text-accent">404</div>
      <h1 className="text-[20px] font-bold text-txt-dark">Page not found</h1>
      <p className="mt-2 max-w-[420px] text-[13px] text-txt-darksec">
        The page you requested does not exist in this demo. Try the homepage or the spot trading terminal.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="rounded-lg border border-bd-light bg-white px-4 py-2 text-[13px] font-semibold text-txt-dark hover:bg-black/5">
          Homepage
        </Link>
        <Link to="/trade/xrp_usdt" className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-night-900 hover:bg-accent-hover">
          Spot Trading
        </Link>
      </div>
    </div>
  );
}
