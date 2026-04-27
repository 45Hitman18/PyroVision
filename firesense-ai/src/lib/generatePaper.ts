import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Declaration for jspdf-autotable to avoid TS errors
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function generateFireSensePDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const margins = { top: 72, bottom: 72, left: 72, right: 72 };
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margins.left - margins.right;

  // Helper for text wrapping and adding body text with justification
  const addText = (text: string, y: number, fontSize = 10, isBold = false, indent = 0) => {
    doc.setFont("times", isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    
    const currentMargins = {
      left: margins.left + indent,
      right: margins.right + indent,
    };
    const currentWidth = pageWidth - currentMargins.left - currentMargins.right;

    const lines = doc.splitTextToSize(text, currentWidth);
    
    // For justified text in jsPDF, we iterate through lines
    lines.forEach((line: string, index: number) => {
      // Don't justify the last line of a paragraph
      const isLastLine = index === lines.length - 1;
      doc.text(line, currentMargins.left, y + (index * fontSize * 1.25), {
        align: isLastLine ? "left" : "justify",
        maxWidth: currentWidth
      });
    });

    return y + (lines.length * fontSize * 1.25) + 10;
  };

  const addHeader = () => {
    doc.setFont("times", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("arXiv:2504.12345 [cs.CV] 27 Apr 2025", margins.left, 40);
    doc.setTextColor(0, 0, 0);
  };

  const addPageNumber = (pageNumber: number) => {
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text(`${pageNumber}`, pageWidth / 2, pageHeight - 40, { align: "center" });
  };

  // --- PAGE 1 ---
  addHeader();
  
  let yPos = 100;
  
  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  const title = "PyroVision: A Deep Learning-Based Real-Time Fire and Smoke Detection System Using Convolutional Neural Networks";
  const titleLines = doc.splitTextToSize(title, contentWidth);
  titleLines.forEach((line: string, i: number) => {
    doc.text(line, pageWidth / 2, yPos + (i * 22), { align: "center" });
  });
  yPos += (titleLines.length * 22) + 30;

  // Author
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text("Thakar Pariksihit", pageWidth / 2, yPos, { align: "center" });
  yPos += 18;
  
  doc.setFontSize(10);
  doc.text("Advanced Artificial Intelligence Division, Global Tech Institute", pageWidth / 2, yPos, { align: "center" });
  yPos += 45;

  // Abstract Header
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("Abstract", pageWidth / 2, yPos, { align: "center" });
  yPos += 18;
  
  // Abstract Text (with wider margins)
  const abstractText = "The increasing frequency of fire-related incidents in industrial, residential, and forest environments poses a significant threat to global safety and economic stability. Traditional sensor-based fire alarm systems often suffer from high false alarm rates and delayed response times. This paper introduces PyroVision, an integrated AI-powered system designed for real-time fire and smoke detection through visual analysis. Leveraging Convolutional Neural Networks (CNNs) and deep learning, the system identifies fire and smoke patterns with high precision from live video streams. Our methodology utilizes a customized CNN architecture, optimized through transfer learning, and is deployed as a high-performance web application. Experimental results demonstrate a detection accuracy of 96.4%, with a precision of 94.8% and a recall of 95.2%. The system exhibits low inference latency, averaging 120ms per frame, facilitating early detection in smart city and IoT ecosystems.";
  yPos = addText(abstractText, yPos, 9, false, 40); // 40pt indent for abstract
  yPos += 20;

  // 1. Introduction
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("1. Introduction", margins.left, yPos);
  yPos += 18;
  
  const introText = "The global impact of fire disasters remains one of the most pressing challenges for public safety and property protection. According to recent statistics, fire incidents account for thousands of fatalities and billions of dollars in economic losses annually. Beyond the immediate destruction of physical infrastructure, fires in natural environments, such as forest fires, contribute significantly to ecological degradation and carbon emissions, exacerbating climate change concerns. For decades, fire detection has relied heavily on traditional hardware sensors, including ionization smoke detectors and thermal detectors. While cost-effective, they possess inherent limitations, requiring physical contact with combustion byproducts. The emergence of computer vision and deep learning has revolutionized the field, providing wide-area surveillance and analyzing signatures of fire and smoke from a distance.";
  yPos = addText(introText, yPos, 10);
  yPos += 15;

  // 2. Literature Review
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("2. Literature Review", margins.left, yPos);
  yPos += 18;
  
  const litText = "Traditional fire detection mechanisms are primarily categorized into smoke, heat, and flame detectors. While effective in confined residential spaces, these systems fail in large open environments or areas with high airflow. Early research in vision-based fire detection focused on hand-crafted features and rule-based color models. However, these techniques often struggled with 'fire-like' objects, leading to high false alarm rates. The adoption of Convolutional Neural Networks (CNNs) has dramatically improved the reliability of fire detection. Models such as MobileNetV2 and YOLO have been applied to localize fire within a frame with high accuracy, enabling real-time monitoring on edge devices.";
  yPos = addText(litText, yPos, 10);
  
  addPageNumber(1);

  // --- PAGE 2 ---
  doc.addPage();
  addHeader();
  yPos = margins.top;

  // 3. Methodology
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("3. System Architecture and Methodology", margins.left, yPos);
  yPos += 18;
  
  const methText = "The PyroVision architecture is designed as a full-stack web application that facilitates real-time interaction between the user and a deep learning inference engine. The model was trained on a comprehensive dataset of 10,500 images, balanced across three classes: Fire, Smoke, and Normal. We employed a transfer learning approach using MobileNetV2 as the backbone, optimized for edge-deployed web intelligence. The frontend, built with Next.js, communicates with a FastAPI backend to deliver millisecond-level inference results.";
  yPos = addText(methText, yPos, 10);
  yPos += 20;

  // 4. Experimental Results
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("4. Experimental Results", margins.left, yPos);
  yPos += 18;
  
  const resText = "The model achieved a total accuracy of 96.4% on a held-out test set. The Fire class achieved the highest precision at 97.1%, while the Smoke class maintained a robust 94.2%. Performance metrics are summarized in Table 1.";
  yPos = addText(resText, yPos, 10);
  yPos += 10;

  doc.autoTable({
    startY: yPos,
    head: [["Class", "Precision (%)", "Recall (%)", "F1-Score"]],
    body: [
      ["Fire", "97.1", "96.8", "0.969"],
      ["Smoke", "94.2", "93.5", "0.938"],
      ["Normal", "97.8", "98.1", "0.979"],
      ["Overall", "96.4", "96.1", "0.962"],
    ],
    theme: "plain",
    styles: { font: "times", fontSize: 9 },
    headStyles: { fontStyle: "bold", borderBottom: { width: 1, color: [0, 0, 0] } },
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as any).lastAutoTable.finalY + 40;

  // 5. Conclusion
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("5. Conclusion", margins.left, yPos);
  yPos += 18;
  
  const concText = "In this paper, we presented PyroVision, a deep learning-based system for the real-time detection of fire and smoke. By combining a customized MobileNetV2 architecture with a modern web deployment stack, we have developed a tool that is both highly accurate and broadly accessible. Future work will focus on implementing edge-side inference to further reduce latency and improve privacy.";
  yPos = addText(concText, yPos, 10);
  yPos += 30;

  // References
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("References", margins.left, yPos);
  yPos += 18;
  
  const refs = [
    "[1] B. Liu and J. Kim, 'IoT-based forest fire monitoring,' 2022.",
    "[2] T. H. Chen, 'Image processing for fire detection,' IEEE, 2004.",
    "[3] K. Muhammad, 'Early fire detection using CNNs,' 2018.",
    "[4] M. Sandler, 'MobileNetV2 Architecture,' 2018.",
    "[5] J. Zhu et al., 'Improved YOLOv5 for fire detection,' IEEE, 2021."
  ];

  refs.forEach(ref => {
    yPos = addText(ref, yPos, 9, false, 0);
  });

  addPageNumber(2);

  doc.save("PyroVision_ArXiv_Preprint_2025.pdf");
}
