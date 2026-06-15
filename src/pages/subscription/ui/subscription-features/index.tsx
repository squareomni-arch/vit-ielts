import { Card } from "antd";
import { twMerge } from "tailwind-merge";

const features = [
  {
    title: "Practice Tests - Listening & Reading",
    free: true,
    pro: true,
  },
  {
    title: "Answer Keys & Explanations",
    free: true,
    pro: true,
  },
  {
    title: "Premium Practice Tests",
    free: false,
    pro: true,
  },
  {
    title: "Unlimited Test Attempts",
    free: false,
    pro: true,
  },
  {
    title: "Detailed Performance Analytics",
    free: false,
    pro: true,
  },
  {
    title: "Priority Customer Support",
    free: false,
    pro: true,
  },
  {
    title: "Access to All Premium Content",
    free: false,
    pro: true,
  },
];

export const SubscriptionFeatures = () => {
  return (
    <div className="w-full">
      <Card>
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-4 font-bold text-gray-900">
                  Features
                </th>
                <th className="text-center p-4 font-bold text-gray-900">
                  Free
                </th>
                <th className="text-center p-4 font-bold text-blue-600">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className={twMerge(
                    "border-b border-gray-100",
                    index % 2 === 0 && "bg-gray-50"
                  )}
                >
                  <td className="p-4 text-gray-700">{feature.title}</td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center">
                      <span
                        className={twMerge(
                          "material-symbols-rounded filled text-xl",
                          feature.free
                            ? "text-green-500"
                            : "text-gray-400"
                        )}
                      >
                        {feature.free ? "check_circle" : "cancel"}
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <div className="flex items-center justify-center">
                      <span
                        className={twMerge(
                          "material-symbols-rounded filled text-xl",
                          feature.pro ? "text-green-500" : "text-gray-400"
                        )}
                      >
                        {feature.pro ? "check_circle" : "cancel"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

