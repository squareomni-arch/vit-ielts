import { Button, Modal } from "antd";
import { useProContentModal } from "../context";
import Link from "next/link";
import { LinkButton } from "../../link-button";
import { useAppContext } from "@/appx/providers";

import { ROUTES } from "@/shared/routes";

export const ProContentModal = () => {
  const open = useProContentModal((state) => state.isOpen);
  const close = useProContentModal((state) => state.close);
  const appContext = useAppContext();

  return (
    <Modal
      open={open}
      onCancel={close}
      title="Upgrade to Pro Account"
      footer={
        <div className="space-x-2">
          <Button onClick={close}>Close</Button>
          <Link href={ROUTES.SUBSCRIPTION} passHref legacyBehavior>
            <LinkButton type="primary" onClick={close}>
              Buy Premium
            </LinkButton>
          </Link>
        </div>
      }
    >
      This is premium content that you can only access with a Pro account
    </Modal>
  );
};
