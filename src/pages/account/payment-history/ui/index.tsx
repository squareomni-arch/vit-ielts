import { MyProfileLayout } from "@/widgets/layouts";
import { Card, Skeleton, Table, TableProps, Tag } from "antd";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { currencyFormat } from "@/shared/lib";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";

// Hàm tạo Order ID từ paymentDate
const generateOrderId = (paymentDate: string, index: number): string => {
  const hash = paymentDate
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#${(hash + index).toString().slice(-4)}`;
};

// Hàm xác định status (có thể cải thiện logic sau)
const getStatus = (paymentDate: string): { text: string; color: string } => {
  const daysAgo = dayjs().diff(dayjs(paymentDate), "day");
  if (daysAgo < 1) return { text: "Processing", color: "#60A5FA" };
  if (daysAgo < 30) return { text: "Success", color: "#34D399" };
  if (daysAgo < 90) return { text: "On Hold", color: "#FBBF24" };
  return { text: "Canceled", color: "#F87171" };
};

export const PagePaymentHistory = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const supabase = createClient();
        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        setOrders(orderData || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser?.id]);

  const dataSource = useMemo(() => {
    return orders.map((order: any, index: number) => ({
      key: index,
      orderId: order.id ? `#${String(order.id).slice(-4)}` : generateOrderId(order.created_at || "", index),
      content: order.plan_name || order.transfer_content || "Pro Subscription",
      paymentDate: order.created_at,
      amount: order.amount || 0,
      status: { text: order.status || "pending", color: order.status === "completed" ? "#34D399" : order.status === "pending" ? "#60A5FA" : "#FBBF24" },
    }));
  }, [orders]);

  const columns: TableProps<(typeof dataSource)[number]>["columns"] = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (orderId: string) => (
        <span className="text-gray-700">{orderId}</span>
      ),
    },
    {
      title: "Course Name",
      dataIndex: "content",
      key: "content",
      render: (content: string) => (
        <span className="text-gray-700">{content}</span>
      ),
    },
    {
      title: "Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (paymentDate: string) => (
        <span className="text-gray-700">
          {dayjs(paymentDate).format("MMMM D, YYYY")}
        </span>
      ),
    },
    {
      title: "Price",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <span className="text-gray-700">{currencyFormat(amount)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: { text: string; color: string }) => (
        <Tag
          style={{
            backgroundColor: status.color,
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "4px 12px",
            fontWeight: 500,
          }}
        >
          {status.text}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <style jsx global>{`
        .order-history-table .ant-table-thead > tr > th {
          background: #c7ccf1 !important;
          border-bottom: 1px solid #e5e7eb;
          border-right: none !important;
          padding: 12px 16px;
          font-weight: 700 !important;
          color: #000000 !important;
        }
        .order-history-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        .order-history-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 16px;
        }
        .order-history-table .ant-table-tbody > tr:hover > td {
          background: inherit !important;
        }
        .order-history-table .ant-table-tbody > tr.bg-gray-50 > td {
          background-color: #f9fafb;
        }
        .order-history-table .ant-table-tbody > tr.bg-white > td {
          background-color: #ffffff;
        }
      `}</style>
      <Card className="shadow-sm rounded-lg" bodyStyle={{ padding: 0 }}>
        <div className="p-6">
          {!loading ? (
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              className="order-history-table"
              rowClassName={(_, index) =>
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }
            />
          ) : (
            <Skeleton active />
          )}
        </div>
      </Card>
    </>
  );
};

PagePaymentHistory.Layout = MyProfileLayout;
