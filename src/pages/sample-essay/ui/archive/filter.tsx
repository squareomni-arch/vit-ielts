import {
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Divider,
  Drawer,
  Input,
  InputRef,
  Space,
} from "antd";
import { Control, Controller, useForm, useFormContext } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import _ from "lodash";
import { SampleEssayProps } from "../..";

type FilterOption = { slug: string; name: string };
type FilterFormValues = {
  search?: string;
  year: string;
  sampleSource: string;
  quarter: string;
  part?: string; // Used for speaking and listening
  questionType?: string; // Used for speaking, reading, and listening
  topic?: string; // Used for writing
  task?: string; // Used for writing
  passage?: string; // Used for reading
  type: string;
  sort: string;
};

const FILTER_CONFIGS = {
  quarters: [
    { slug: "Q1", name: "Quarter 1 T1-T4" },
    { slug: "Q2", name: "Quarter 2 T5-T8" },
    { slug: "Q3", name: "Quarter 3 T9-T12" },
  ],
  speakingParts: [
    { slug: "part-1", name: "Part 1" },
    { slug: "part-2", name: "Part 2" },
    { slug: "part-3", name: "Part 3" },
  ],
  writingTasks: [
    { slug: "task-1", name: "Task 1" },
    { slug: "task-2", name: "Task 2" },
  ],
  listeningParts: [
    { slug: "part-1", name: "Part 1" },
    { slug: "part-2", name: "Part 2" },
    { slug: "part-3", name: "Part 3" },
    { slug: "part-4", name: "Part 4" },
  ],
  readingPassages: [
    { slug: "passage-1", name: "Passage 1" },
    { slug: "passage-2", name: "Passage 2" },
    { slug: "passage-3", name: "Passage 3" },
  ],
  questionTypes: [
    { slug: "FILL_BLANK", name: "Gap Filling" },
    { slug: "MATCHING_HEADING", name: "Matching Headings" },
    { slug: "TRUE_FALSE", name: "True - False - Not Given" },
    { slug: "YES_NO", name: "Yes - No - Not Given" },
    { slug: "MULTIPLE_CHOICE_ONE", name: "Multiple Choice (One Answer)" },
    { slug: "MATCHING_INFO", name: "Matching Information" },
    { slug: "MATCHING_NAMES", name: "Matching Names" },
    { slug: "MULTIPLE_CHOICE_MANY", name: "Multiple Choice (Many Answers)" },
    { slug: "MAP_DIAGRAM_LABEL", name: "Map, Diagram Label" },
    { slug: "OTHERS", name: "Other Types" },
  ],
  topics: [
    { slug: "LINE", name: "Line Graph" },
    { slug: "BAR", name: "Bar Chart" },
    { slug: "PIE", name: "Pie Chart" },
    { slug: "TABLE", name: "Table" },
    { slug: "MIXED", name: "Mixed Graph" },
    { slug: "MAP", name: "Map" },
    { slug: "PROCESS", name: "Process" },
  ],
};

interface FilterSectionProps {
  title?: string;
  options: FilterOption[];
  name: keyof FilterFormValues;
  control: Control<FilterFormValues>;
}

const FilterCheckboxGroup: React.FC<FilterSectionProps> = ({
  options,
  name,
  control,
}) => (
  <div className="flex flex-col gap-4">
    {options.map((item) => (
      <Controller
        key={item.slug}
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <Checkbox
            checked={value === item.slug}
            onChange={(e) => onChange(e.target.checked ? item.slug : "")}
          >
            {item.name}
          </Checkbox>
        )}
      />
    ))}
  </div>
);

const FilterCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Card>
    <h3 className="text-lg md:text-xl font-bold mb-5">{title}</h3>
    {children}
  </Card>
);

const SearchCard: React.FC<{
  setValue: (
    name: keyof FilterFormValues,
    value: string,
    options?: object
  ) => void;
}> = ({ setValue }) => {
  const router = useRouter();
  const searchInputRef = useRef<InputRef>(null);

  const handleSearch = () => {
    if (searchInputRef.current) {
      setValue("search", searchInputRef.current.input?.value || "", {
        shouldDirty: true,
      });
    }
  };

  return (
    <FilterCard title="Search">
      <Space.Compact style={{ width: "100%" }}>
        <Input
          ref={searchInputRef}
          allowClear
          onClear={() => setValue("search", "", { shouldDirty: true })}
          defaultValue={router.query.search?.toString() || ""}
          placeholder="Search"
          onPressEnter={handleSearch}
        />
        <Button
          type="primary"
          icon={
            <span
              className="material-symbols-rounded flex"
              style={{ display: "flex" }}
            >
              search
            </span>
          }
          onClick={handleSearch}
        />
      </Space.Compact>
    </FilterCard>
  );
};

interface FilterProps {
  drawerOpen: boolean;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  filterData: SampleEssayProps["filterData"];
  skill: "speaking" | "writing" | "reading" | "listening";
}

export const Filter: React.FC<FilterProps> = ({
  drawerOpen,
  setDrawerOpen,
  filterData,
  skill,
}) => {
  const router = useRouter();
  const { control, setValue, reset } = useFormContext<FilterFormValues>();
  const {
    control: mobileControl,
    getValues,
    reset: mobileReset,
  } = useForm<FilterFormValues>();

  useEffect(() => {
    const queryParams = _.merge(
      { type: "all", sort: "newest" },
      _.omit(router.query, ["slug"])
    );
    reset(queryParams as FilterFormValues);
    mobileReset(queryParams as FilterFormValues);
  }, [mobileReset, reset, router.query]);

  const commonFilters = (
    control: Control<FilterFormValues>,
    isMobile = false
  ) => (
    <>
      <div>
        <h3 className="text-lg md:text-xl font-bold mb-5">Year</h3>
        <FilterCheckboxGroup
          options={filterData?.annualPeriods?.nodes || filterData?.sampleEssayFilterData?.years?.map((y: any) => ({ slug: y, name: y })) || []}
          name="year"
          control={control}
        />
      </div>
      {isMobile && <Divider />}
      <div>
        <h3 className="text-lg md:text-xl font-bold mb-5">Sample Source</h3>
        <FilterCheckboxGroup
          options={filterData?.sampleSources?.nodes || filterData?.sampleEssayFilterData?.sources?.map((s: any) => ({ slug: s, name: s })) || []}
          name="sampleSource"
          control={control}
        />
      </div>
      {isMobile && <Divider />}
      <div>
        <h3 className="text-lg md:text-xl font-bold mb-5">Quarter</h3>
        <FilterCheckboxGroup
          options={FILTER_CONFIGS.quarters}
          name="quarter"
          control={control}
        />
      </div>
      {isMobile && <Divider />}
    </>
  );

  const skillSpecificFilters = (
    control: Control<FilterFormValues>,
    isMobile = false
  ) => {
    switch (skill) {
      case "speaking":
        return (
          <>
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-5">
                Speaking Part
              </h3>
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.speakingParts}
                name="part"
                control={control}
              />
            </div>
          </>
        );
      case "writing":
        return (
          <>
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-5">Topic</h3>
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.topics}
                name="topic"
                control={control}
              />
            </div>
            {isMobile && <Divider />}
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-5">Task</h3>
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.writingTasks}
                name="task"
                control={control}
              />
            </div>
          </>
        );
      case "reading":
        return (
          <>
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-5">
                Question Form
              </h3>
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.questionTypes}
                name="questionType"
                control={control}
              />
            </div>
            {isMobile && <Divider />}
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-5">Passage</h3>
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.readingPassages}
                name="passage"
                control={control}
              />
            </div>
          </>
        );
      case "listening":
        return (
          <>
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-5">
                Listening Part
              </h3>
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.listeningParts}
                name="part"
                control={control}
              />
            </div>
            {isMobile && <Divider />}
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-5">
                Question Form
              </h3>
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.questionTypes}
                name="questionType"
                control={control}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: { bodyPadding: 16 },
          Checkbox: { fontSize: 16, lineHeight: 1 },
        },
      }}
    >
      <div className="space-y-6">
        <SearchCard setValue={setValue} />
        <FilterCard title="Year">
          <FilterCheckboxGroup
            options={filterData?.annualPeriods?.nodes || filterData?.sampleEssayFilterData?.years?.map((y: any) => ({ slug: y, name: y })) || []}
            name="year"
            control={control}
          />
        </FilterCard>
        <FilterCard title="Sample Source">
          <FilterCheckboxGroup
            options={filterData?.sampleSources?.nodes || filterData?.sampleEssayFilterData?.sources?.map((s: any) => ({ slug: s, name: s })) || []}
            name="sampleSource"
            control={control}
          />
        </FilterCard>
        <FilterCard title="Quarter">
          <FilterCheckboxGroup
            options={FILTER_CONFIGS.quarters}
            name="quarter"
            control={control}
          />
        </FilterCard>
        {skill === "speaking" ? (
          <>
            <FilterCard title="Speaking Part">
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.speakingParts}
                name="part"
                control={control}
              />
            </FilterCard>
          </>
        ) : skill === "writing" ? (
          <>
            <FilterCard title="Topic">
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.topics}
                name="topic"
                control={control}
              />
            </FilterCard>
            <FilterCard title="Task">
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.writingTasks}
                name="task"
                control={control}
              />
            </FilterCard>
          </>
        ) : skill === "reading" ? (
          <>
            <FilterCard title="Question Form">
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.questionTypes}
                name="questionType"
                control={control}
              />
            </FilterCard>
            <FilterCard title="Passage">
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.readingPassages}
                name="passage"
                control={control}
              />
            </FilterCard>
          </>
        ) : (
          <>
            <FilterCard title="Listening Part">
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.listeningParts}
                name="part"
                control={control}
              />
            </FilterCard>
            <FilterCard title="Question Form">
              <FilterCheckboxGroup
                options={FILTER_CONFIGS.questionTypes}
                name="questionType"
                control={control}
              />
            </FilterCard>
          </>
        )}
      </div>
      <Drawer
        title="Filter"
        open={drawerOpen}
        closeIcon={false}
        footer={
          <div className="flex gap-4">
            <Button
              type="primary"
              size="large"
              block
              className="w-1/2"
              onClick={() => {
                Object.entries(getValues()).forEach(([key, value]) => {
                  setValue(key as keyof FilterFormValues, value, {
                    shouldDirty: true,
                  });
                });
                setDrawerOpen(false);
              }}
            >
              <span className="text-sm">Apply</span>
            </Button>
            <Button
              block
              size="large"
              className="w-1/2"
              onClick={() => setDrawerOpen(false)}
            >
              <span className="text-sm">Cancel</span>
            </Button>
          </div>
        }
      >
        {commonFilters(mobileControl, true)}
        {skillSpecificFilters(mobileControl, true)}
      </Drawer>
    </ConfigProvider>
  );
};
