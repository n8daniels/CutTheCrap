'use client';

import { useState } from 'react';
import { BillSection as BillSectionType } from '@/types';
import PoliticalLeanBar from './PoliticalLeanBar';
import EconomicTags from './EconomicTags';

interface BillSectionProps {
  section: BillSectionType;
}

export default function BillSection({ section }: BillSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  return (
    <div className="card card-hover mb-4">
      {/* Section Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm text-text-muted mb-1">
              Section {section.sectionNumber}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {section.title}
            </h3>
            <p className="text-sm text-text-secondary">{section.preview}</p>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className={`w-5 h-5 text-text-muted transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Political Lean Bar - Always Visible */}
        <div className="mt-3">
          <PoliticalLeanBar score={section.politicalLean} />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t space-y-6">
          {/* 5th Grade Summary */}
          <div>
            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
              Plain English Summary
            </h4>
            <p className="text-text-primary leading-relaxed">
              {section.simplifiedSummary}
            </p>
          </div>

          {/* Economic Tags */}
          {section.economicTags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
                Economic Characteristics
              </h4>
              <EconomicTags tags={section.economicTags} />
            </div>
          )}

          {/* Ideology Score */}
          <div>
            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
              Ideology Score
            </h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                Socialist/Regulated ({section.ideologyScore})
              </span>
              <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-red-500 via-gray-400 to-blue-500 rounded-full">
                <div
                  className="h-2 bg-white border-2 border-text-primary rounded-full"
                  style={{
                    marginLeft: `calc(${((section.ideologyScore + 5) / 10) * 100}% - 4px)`,
                    width: '8px',
                  }}
                />
              </div>
              <span className="text-text-secondary">Libertarian/Free Market</span>
            </div>
          </div>

          {/* Risk Notes */}
          {section.riskNotes && section.riskNotes.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">
                ⚠ Risk Notes
              </h4>
              <ul className="space-y-1">
                {section.riskNotes.map((note, idx) => (
                  <li key={idx} className="text-sm text-orange-800">
                    • {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deep Dive Toggle */}
          {section.deepDive && (
            <div>
              <button
                onClick={() => setShowDeepDive(!showDeepDive)}
                className="btn-secondary w-full md:w-auto"
              >
                {showDeepDive ? 'Hide' : 'Show'} Deep Dive Analysis
              </button>

              {showDeepDive && (
                <div className="mt-4 space-y-4 bg-bg-secondary rounded-lg p-4">
                  <div>
                    <h5 className="font-semibold text-text-primary mb-2">
                      Historical Context
                    </h5>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {section.deepDive.historicalContext}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-text-primary mb-2">
                      Geopolitical Implications
                    </h5>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {section.deepDive.geopoliticalImplications}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-text-primary mb-2">
                      Economic Framing
                    </h5>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {section.deepDive.economicFraming}
                    </p>
                  </div>

                  {section.deepDive.precedentRisks.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-text-primary mb-2">
                        Precedent-Setting Risks
                      </h5>
                      <ul className="space-y-1">
                        {section.deepDive.precedentRisks.map((risk, idx) => (
                          <li key={idx} className="text-sm text-text-secondary">
                            • {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.deepDive.ideologicalFingerprints.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-text-primary mb-2">
                        Ideological Fingerprints
                      </h5>
                      <ul className="space-y-1">
                        {section.deepDive.ideologicalFingerprints.map((fingerprint, idx) => (
                          <li key={idx} className="text-sm text-text-secondary">
                            • {fingerprint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Raw Text Toggle */}
          {section.rawText && (
            <div>
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="text-sm text-text-muted hover:text-text-primary underline"
              >
                {showRawText ? 'Hide' : 'Show'} Original Text
              </button>

              {showRawText && (
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">
                    {section.rawText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
