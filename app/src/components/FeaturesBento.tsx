import React from "react";
import { SectionHeader } from "./SectionHeader";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const FeaturesBento = () => {
  return (
    <section className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="why it works"
          title={
            <>
              Everything that keeps a draw fair — <br className="hidden sm:inline" />
              still works when nobody can see
            </>
          }
          description="A public prize pool stays honest because everyone can watch. Ticket keeps that same honesty, without asking anyone to watch."
        />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
          {/* Bento Item 1: Balance privacy (Large Left Column) */}
          <div className="md:col-span-7 verseo-card verseo-card-hover p-8 flex flex-col justify-between bg-[#181818] text-white relative overflow-hidden">
            <div>
              <span className="text-[11px] font-mono-custom uppercase tracking-widest text-[#748CEB] font-semibold mb-4 block">
                The heart of it
              </span>
              <h3 className="text-2xl font-bold text-white mb-2">Your Balance? Nobody's Business.</h3>
              <p className="text-sm text-[#a0a0a0] mb-6">
                The longer you hold, the better your odds get — and that math happens completely out
                of sight. Not other players, not us, nobody sees a single number.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#a0a0a0]">
              <span>Private, always</span>
              <span className="font-mono-custom text-[#748CEB]">Not even we can see it</span>
            </div>
          </div>

          {/* Bento Item 2: On-chain randomness (Right Column) */}
          <div className="md:col-span-5 verseo-card verseo-card-hover p-8 flex flex-col justify-between bg-white relative overflow-hidden">
            <div>
              <span className="text-[11px] font-mono-custom uppercase tracking-widest text-[#d97706] font-semibold mb-4 block">
                No one picks the winner
              </span>
              <h3 className="text-2xl font-bold text-[#181818] mb-2">Nobody Can Rig The Draw</h3>
              <p className="text-sm text-[#686868] mb-6">
                The winner is chosen the same way every time — by the blockchain itself. No operator,
                no insider, no way to see it coming.
              </p>

              <div className="w-full rounded-2xl bg-[#0c0a18] text-white p-5 border border-white/10 shadow-inner flex flex-col justify-between space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-[11px] font-bold text-white tracking-wide">FHEVM VRF #0042</span>
                  </div>
                  <span className="text-[10px] text-[#748CEB] bg-[#748CEB]/15 px-2 py-0.5 rounded border border-[#748CEB]/30 font-medium">
                    ON-CHAIN
                  </span>
                </div>
                
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between text-[#888]">
                    <span>Entropy Seed</span>
                    <span className="text-white font-mono">0x4b7f...91e3</span>
                  </div>
                  <div className="flex justify-between text-[#888]">
                    <span>Weight Formula</span>
                    <span className="text-[#748CEB] font-mono font-medium">W = ∫ b(t) dt</span>
                  </div>
                  <div className="flex justify-between text-[#888]">
                    <span>Operator Bias</span>
                    <span className="text-[#10b981] font-semibold">0.0000% (Impossible)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-[#aaa]">
                  <span>4/4 claims audited</span>
                  <span className="text-white flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-[#10b981]" weight="fill" />
                    Verifiably Fair
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Chosen by</span>
              <span className="font-mono-custom text-[#d97706]">The blockchain, not us</span>
            </div>
          </div>

          {/* Bento Item 3: Scales fairly (Left Column 5) */}
          <div className="md:col-span-5 verseo-card verseo-card-hover p-8 flex flex-col justify-between bg-white relative overflow-hidden">
            <div>
              <span className="text-[11px] font-mono-custom uppercase tracking-widest text-[#15803d] font-semibold mb-4 block">
                Built to grow
              </span>
              <h3 className="text-2xl font-bold text-[#181818] mb-2">Fair, Even At Scale</h3>
              <p className="text-sm text-[#686868] mb-6">
                Whether ten people join or ten thousand, every draw stays just as fast and just as
                fair for everyone in it.
              </p>
            </div>

            <div className="pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Works for</span>
              <span className="font-mono-custom">Any size crowd</span>
            </div>
          </div>

          {/* Bento Item 4: Clear pending state (Right Column 7) */}
          <div className="md:col-span-7 verseo-card verseo-card-hover p-8 flex flex-col justify-between bg-white relative overflow-hidden">
            <div>
              <span className="text-[11px] font-mono-custom uppercase tracking-widest text-[#006fff] font-semibold mb-4 block">
                No guessing games
              </span>
              <h3 className="text-2xl font-bold text-[#181818] mb-2">You'll Never Be Left Wondering</h3>
              <p className="text-sm text-[#686868] mb-6">
                Revealing a winner takes a moment — most apps just show a spinner and hope. Ticket
                tells you exactly what's happening, and what happens next.
              </p>

              <div className="w-full rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb] p-5 flex flex-col justify-between space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-2 text-[#181818]">
                  <span className="text-[11px] font-bold tracking-tight">Draw Settlement Cycle</span>
                  <span className="text-[10px] font-semibold text-[#748CEB] bg-[#748CEB]/15 px-2 py-0.5 rounded">
                    Stage 2 of 3
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-xl bg-white border border-[#e5e7eb] flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[#10b981] font-semibold mb-1">
                      <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                      <span>Deposit</span>
                    </div>
                    <span className="text-[10px] text-[#666]">Principal safe & encrypted</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#748CEB]/10 border border-[#748CEB]/40 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[#4361ee] font-semibold mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#748CEB] animate-ping" />
                      <span>FHE Tally</span>
                    </div>
                    <span className="text-[10px] text-[#333]">Tournament selection in ZK</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#e5e7eb] flex flex-col justify-between opacity-70 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[#888] font-semibold mb-1">
                      <span>03</span>
                      <span>Payout</span>
                    </div>
                    <span className="text-[10px] text-[#666]">Winner receives pool</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e5e7eb] flex items-center justify-between text-[10px] text-[#666]">
                  <span>Zero blind waiting</span>
                  <span className="text-[#181818] font-medium font-sans">Every transition announced on-chain</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>While you wait</span>
              <span className="font-mono-custom text-[#006fff]">Always clear what's next</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
