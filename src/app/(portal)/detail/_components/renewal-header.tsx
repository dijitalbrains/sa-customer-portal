"use client";

import { useState } from "react";
import AddP1Filter from "./add-p1-filter";
import EditZone from "@/components/shared/edit-zone/edit-zone";
import NicknameDialog from "./nickname-dialog";
import RemoveButton from "./remove-button";
import { removeSubscription } from "../actions";
import type { RenewalSubscription } from "@/lib/types/subscription";

interface RenewalHeaderProps {
  subscription: RenewalSubscription;
  showAddP1Filter: boolean;
  canRemoveSubscription: boolean;
}

const TITLE_CLASS = "font-bold text-lg sm:text-2xl text-text-primary leading-8";

export default function RenewalHeader({
  subscription,
  showAddP1Filter,
  canRemoveSubscription,
}: RenewalHeaderProps) {
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-4 min-w-0">
        <EditableLabel
          text={`${subscription.technology} | Zone ${subscription.zone}`}
          onClick={() => setZoneOpen(true)}
        />
        <EditableLabel
          text={subscription.nickname || "Add nickname"}
          onClick={() => setNicknameOpen(true)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showAddP1Filter && <AddP1Filter subscriptionId={subscription.id} />}
        {canRemoveSubscription && (
          <RemoveButton
            label="Delete Subscription"
            confirmTitle="Remove subscription?"
            confirmMessage="Are you sure you want to remove this subscription? All items will be deleted and this action cannot be undone."
            action={removeSubscription.bind(null, subscription.id)}
            variant="pill"
          />
        )}
      </div>

      <NicknameDialog
        open={nicknameOpen}
        onClose={() => setNicknameOpen(false)}
        subscriptionId={subscription.id}
        currentNickname={subscription.nickname}
      />
      {zoneOpen && (
        <EditZone
          open={zoneOpen}
          onClose={() => setZoneOpen(false)}
          subscriptionId={subscription.id}
        />
      )}
    </header>
  );
}

interface EditableLabelProps {
  text: string;
  onClick: () => void;
}

function EditableLabel({ text, onClick }: EditableLabelProps) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 cursor-pointer">
      <span className={TITLE_CLASS}>{text}</span>
      <img src="/assets/icons/edit-pencil.svg" alt="Edit" className="w-5 h-5" />
    </button>
  );
}
