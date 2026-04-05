import { Button, Modal } from "antd";
import { useProContentModal } from "../context";
import Link from "next/link";
import { LinkButton } from "../../link-button";
import { useAppContext } from "@/appx/providers";
import { useMemo } from "react";

export const ProContentModal = () => {
  const open = useProContentModal((state) => state.isOpen);
  const close = useProContentModal((state) => state.close);
  const appContext = useAppContext();

  const buyProLink = useMemo(() => {
    try {
      return appContext.masterData.websiteOptions.websiteOptionsFields
        .generalSettings.buyProLink;
    } catch {
      return "";
    }
  }, [appContext]);

  return (
    <Modal
      open={open}
      onCancel={close}
      title="Upgrade to Pro Account"
      footer={
        <div className="space-x-2">
          <Button onClick={close}>Close</Button>
          <Link href={typeof buyProLink === 'string' && buyProLink ? buyProLink : "/"} passHref legacyBehavior>
            <LinkButton target="_blank" type="primary">
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
