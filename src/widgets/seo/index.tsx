import Head from "next/head";
import parse from "html-react-parser";

export const SEOHeader = ({
  fullHead: fullHeadString,
  title,
}: {
  fullHead?: string;
  title?: string;
}) => {
  const fullHead = fullHeadString ? parse(fullHeadString) : null;
  return (
    <Head>
      {title && <title>{title}</title>}
      {fullHead}
    </Head>
  );
};
