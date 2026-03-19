// src/components/ArtifactCard.tsx
"use client";

import { useState, useRef } from "react";
import { Tag } from "../Tag";
import { StatusBadge } from "../StatusBadge";
import type { ArtifactManifest, ReviewAction } from "@/lib/types";
import { Thumbnail } from "./components/Thumbnail/Thumbnail";
import { PreviewModal } from "./components/PreviewModal/PreviewModal";
import { HeartButton } from "./components/HeartButton/HeartButton";
import { CommentButton } from "./components/CommentButton/CommentButton";
import { ApproveButton } from "./components/ApproveButton/ApproveButton";
import { FlagButton } from "./components/FlagButton/FlagButton";
import { CommentForm } from "./components/CommentForm/CommentForm";

interface Props {
  manifest: ArtifactManifest;
}

const IMG_ROOT = "/api/outputs";

export const ArtifactCard = ({ manifest: initial }: Props) => {
  const [manifest, setManifest] = useState(initial);
  const [commenting, setCommenting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  async function dispatch(action: ReviewAction) {
    const res = await fetch(`/api/review/${manifest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    if (res.ok) setManifest(await res.json());
  }

  const handleHeartClick = () => dispatch({ action: "heart" });

  const handleCommentClick = () => setCommenting((c) => !c);

  const handleApproveClick = () =>
    dispatch({ action: "approve", approvedBy: "Reviewer" });

  const handleCommentSubmit = ({
    commentAuthor,
    commentText,
  }: {
    commentAuthor: string;
    commentText: string;
  }) => {
    dispatch({
      action: "comment",
      author: commentAuthor || "Anonymous",
      text: commentText,
    });
    setCommenting(false);
  };

  const imgSrc = `${IMG_ROOT}/${manifest.outputPath}`;
  const borderColor =
    manifest.state === "approved"
      ? "border-green-200"
      : manifest.state === "flagged"
        ? "border-red-200"
        : "border-gray-100";

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden ${borderColor}`}
    >
      <Thumbnail
        src={imgSrc}
        alt={`${manifest.productId} ${manifest.market} ${manifest.aspectRatio}`}
        ratio={manifest.aspectRatio}
        onClick={() => dialogRef?.current?.showModal()}
      />

      <PreviewModal
        ref={dialogRef}
        src={imgSrc}
        alt={`${manifest.productId} ${manifest.market} ${manifest.aspectRatio}`}
      />

      {/* Tags */}
      <div className="p-3">
        <div className="flex flex-wrap gap-1 mb-2">
          <Tag label={manifest.aspectRatio} variant="ratio" />
          <Tag label={manifest.market} variant="market" />
          <Tag
            label={
              manifest.compliance.passed ? "✓ compliant" : "✗ non-compliant"
            }
            variant={manifest.compliance.passed ? "ok" : "fail"}
          />
          <Tag
            label={`hero: ${manifest.assetProvenance.hero}`}
            variant={
              manifest.assetProvenance.hero === "brief" ? "brief" : "openai"
            }
          />
        </div>

        <StatusBadge state={manifest.state} />

        {/* Flag reason */}
        {manifest.state === "flagged" && manifest.review.flaggedReason && (
          <p className="mt-1.5 text-[10px] text-red-500 bg-red-50 rounded px-2 py-1">
            {manifest.review.flaggedReason}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-50">
          <HeartButton
            hearts={manifest.review.hearts}
            onClick={handleHeartClick}
          />
          <CommentButton
            comments={manifest.review.comments}
            onClick={handleCommentClick}
          />
          <div className="flex-1" />
          {manifest.state !== "approved" && (
            <ApproveButton onClick={handleApproveClick} />
          )}
          {manifest.state !== "flagged" && (
            <FlagButton
              onClick={() => {
                const reason = window.prompt("Flag reason?");
                if (reason) dispatch({ action: "flag", reason });
              }}
            />
          )}
        </div>
        {commenting && <CommentForm onClick={handleCommentSubmit} />}

        {/* Comment list */}
        {manifest.review.comments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {manifest.review.comments.map((c, i) => (
              <div key={i} className="text-[10px] bg-gray-50 rounded px-2 py-1.5">
                <span className="font-medium text-gray-600">{c.author}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-500">{c.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
