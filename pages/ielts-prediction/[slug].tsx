import { GetServerSideProps } from "next";

export default function Page() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug;
  return {
    redirect: {
      destination: `/blog/${slug}`,
      permanent: true,
    },
  };
};
