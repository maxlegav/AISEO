interface AuditReviewProps {
  onApprove: () => void;
  onReject: () => void;
  children: React.ReactNode;
}

export default function AuditReview({
  onApprove,
  onReject,
  children,
}: AuditReviewProps) {
  return (
    <div>
      {children}

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 -mx-6 -mb-6 flex items-center justify-end gap-3">
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-medium transition-colors"
        >
          Reject Audit
        </button>
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-medium transition-colors"
        >
          Approve & Deliver
        </button>
      </div>
    </div>
  );
}
