"use client";

import dynamic from "next/dynamic";
import { type ForwardedRef, forwardRef, useEffect, useState } from "react";

const DynamicTextarea = dynamic(() => import("react-textarea-autosize"), {
  ssr: false,
});

type Props = React.ComponentProps<typeof DynamicTextarea>;

export const TextareaWrapper = forwardRef(
  (props: Props, ref: ForwardedRef<HTMLTextAreaElement>) => {
    return <DynamicTextarea {...props} ref={ref} />;
  },
);

TextareaWrapper.displayName = "TextareaWrapper";
