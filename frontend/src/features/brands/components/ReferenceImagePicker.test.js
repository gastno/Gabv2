import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReferenceImagePicker from "./ReferenceImagePicker";

describe("ReferenceImagePicker", () => {
  const createObjectURL = URL.createObjectURL;
  const revokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => "blob:reference-preview");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  it("forwards selected files and displays removable previews", async () => {
    const file = new File(["image"], "reference.png", { type: "image/png" });
    const onFilesSelected = jest.fn();
    const onRemove = jest.fn();
    const { unmount } = render(
      <ReferenceImagePicker
        files={[file]}
        error=""
        onFilesSelected={onFilesSelected}
        onRemove={onRemove}
      />
    );

    expect(await screen.findByAltText("Preview of reference.png")).toHaveAttribute("src", "blob:reference-preview");
    fireEvent.change(screen.getByLabelText("Reference images (optional)"), {
      target: { files: [file] },
    });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);

    fireEvent.click(screen.getByRole("button", { name: "Remove reference.png" }));
    expect(onRemove).toHaveBeenCalledWith(0);
    unmount();
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:reference-preview"));
  });

  it("announces upload validation errors", () => {
    render(
      <ReferenceImagePicker
        files={[]}
        error="Each reference image must be 5 MB or smaller."
        onFilesSelected={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Each reference image must be 5 MB or smaller.");
  });
});
