/* ---------------------------------------------------------------------------
 * Simulated advisor responses.
 * This app runs fully client-side with no backend, so there is no live LLM
 * call here — these functions turn the numbers the app already computed into
 * plain-language notes, in the same cautious tone the real prompts asked for.
 * ------------------------------------------------------------------------- */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fmtVnd(n) {
  return (Number(n) || 0).toLocaleString("vi-VN") + " đ";
}

export async function mockChatReply(userText, snapshot) {
  await delay(600 + Math.random() * 500);
  const q = (userText || "").toLowerCase();
  const lines = [];

  if (/vay|mua|trả góp|lãi suất/.test(q)) {
    lines.push(
      `Với dư nợ hiện tại ${fmtVnd(snapshot.totalLiabilities)} trên tài sản ròng ${fmtVnd(snapshot.netWorth)}, một khoản vay mới sẽ làm tăng cả tổng nợ và số tiền trả góp hàng tháng.`,
      `Chị có thể xem tác động cụ thể (DTI, quỹ thanh khoản, dòng tiền trước/sau) ở tab "Mô phỏng" → "Mua tài sản mới bằng vay" — số liệu ở đó được tính trực tiếp từ dữ liệu thật của chị, không phải ước lượng chung chung.`
    );
  } else if (/mục tiêu|tiến độ|đúng hướng/.test(q)) {
    const onTrack = snapshot.goals.filter((g) => Number(g.currentAmount) > 0).length;
    lines.push(
      snapshot.goals.length
        ? `Chị hiện có ${snapshot.goals.length} mục tiêu đang theo dõi. Tab "Mục tiêu" tính dự phóng dựa trên số dư hiện có, mức đóng góp hàng tháng và lợi nhuận kỳ vọng của từng mục tiêu — phần trăm "đang trên đà đạt mục tiêu" ở đó phản ánh đúng số liệu hiện tại.`
        : `Chị chưa có mục tiêu nào trong hệ thống — có thể thêm ở tab "Mục tiêu" để bắt đầu theo dõi tiến độ.`,
      `Lưu ý: dự phóng luôn giả định lợi nhuận đều đặn mỗi năm, thực tế thị trường sẽ có biến động lên xuống.`
    );
  } else if (/an toàn|rủi ro|cân bằng|thận trọng/.test(q)) {
    const total = Object.values(snapshot.tierTotals).reduce((a, b) => a + b, 0) || 1;
    const safePct = ((snapshot.tierTotals[1] || 0) / total) * 100;
    const specPct = ((snapshot.tierTotals[4] || 0) / total) * 100;
    lines.push(
      `Hiện khoảng ${safePct.toFixed(0)}% tài sản của chị ở nhóm an toàn và ${specPct.toFixed(0)}% ở nhóm đầu cơ.`,
      safePct > 40
        ? "Tỷ trọng an toàn khá cao — điều này giảm rủi ro biến động nhưng cũng có thể khiến tài sản tăng trưởng chậm hơn lạm phát về dài hạn."
        : specPct > 20
          ? "Tỷ trọng đầu cơ đang ở mức đáng chú ý — phần này thường biến động mạnh hơn các nhóm còn lại."
          : "Cơ cấu hiện tại khá cân bằng giữa các nhóm rủi ro."
    );
  } else {
    lines.push(
      `Tài sản ròng hiện tại của chị là ${fmtVnd(snapshot.netWorth)}, thu nhập khoảng ${fmtVnd(snapshot.monthlyIncome)}/tháng và chi tiêu khoảng ${fmtVnd(snapshot.monthlyExpense)}/tháng.`,
      `Chị có thể hỏi cụ thể hơn về một khoản vay, một mục tiêu, hoặc tỷ trọng rủi ro để tôi diễn giải sát số liệu hơn.`
    );
  }

  lines.push("(Đây là phản hồi mô phỏng dựng sẵn từ dữ liệu của chị, không phải một mô hình AI thật — ứng dụng này chạy hoàn toàn phía trình duyệt.)");
  return lines.join("\n\n");
}

export async function mockInterpret(payload) {
  await delay(600 + Math.random() * 500);
  const p = payload;
  const lines = [];

  switch (p.kich_ban) {
    case "Mua tài sản mới bằng vay":
      lines.push(`- Khoản vay ${fmtVnd(p.so_tien_vay)} đưa trả góp hàng tháng lên ${fmtVnd(p.tra_gop_thang)}, kéo DTI từ ${p.DTI_truoc_pct}% lên ${p.DTI_sau_pct}%.`);
      lines.push(`- Quỹ thanh khoản đổi từ ${p.quy_thanh_khoan_truoc_thang} tháng còn ${p.quy_thanh_khoan_sau_thang} tháng sau khi dùng tiền trả trước.`);
      lines.push(`- Quy về hiện giá, tổng chi phí vay tương đương ${fmtVnd(p.npv_chi_phi_vay)} — trong khi số tiền trả trước, nếu đem đầu tư thay vào đó, có thể đạt khoảng ${fmtVnd(p.chi_phi_co_hoi_tra_truoc_fv)} theo giả định lợi nhuận đã chọn.`);
      if (p.ty_trong_bds_sau_pct !== null && p.ty_trong_bds_sau_pct !== undefined) lines.push(`- Tỷ trọng bất động sản trong tổng tài sản sau giao dịch khoảng ${p.ty_trong_bds_sau_pct}%.`);
      if (p.dong_tien_rong_sau < 0) lines.push(`- Cần lưu ý: dòng tiền ròng sau giao dịch âm khoảng ${fmtVnd(Math.abs(p.dong_tien_rong_sau))}/tháng.`);
      break;
    case "Stress-test lãi suất vay":
      lines.push(`- Ở mức lãi suất hiện tại, DTI và dòng tiền ròng đang ở mức nền.`);
      p.cac_muc_lai_tang.forEach((r) => {
        if (r.tang_diem_pct === 0) return;
        lines.push(`- Nếu lãi suất tăng thêm ${r.tang_diem_pct} điểm %, DTI lên khoảng ${r.DTI_pct}% và dòng tiền ròng còn ${fmtVnd(r.dong_tien_rong)}/tháng.`);
      });
      const worst = p.cac_muc_lai_tang[p.cac_muc_lai_tang.length - 1];
      if (worst && worst.dong_tien_rong < 0) lines.push(`- Ở kịch bản tăng lãi mạnh nhất, dòng tiền ròng chuyển âm — đây là vùng cần chuẩn bị phương án dự phòng.`);
      break;
    case "Trả nợ sớm":
      lines.push(`- Trả sớm ${fmtVnd(p.so_tien_tra_som)} cho "${p.khoan_vay}" đưa trả góp từ ${fmtVnd(p.tra_gop_cu)} xuống còn ${fmtVnd(p.tra_gop_moi)}/tháng.`);
      lines.push(`- Lãi tiết kiệm ước tính (chắc chắn, không phụ thuộc thị trường): ${fmtVnd(p.lai_tiet_kiem_uoc_tinh)}.`);
      lines.push(`- Nếu thay vào đó đem số tiền này đi đầu tư ở mức lợi nhuận ${p.loi_nhuan_neu_dau_tu_thay_the_pct_nam}%/năm, lãi ước tính có thể là ${fmtVnd(p.lai_uoc_tinh_neu_dau_tu)} — nhưng đây là con số không chắc chắn, phụ thuộc diễn biến thị trường.`);
      lines.push(`- Quỹ thanh khoản sau khi trả sớm còn khoảng ${p.quy_thanh_khoan_sau_thang} tháng chi tiêu.`);
      break;
    default:
      lines.push("- Đã ghi nhận số liệu kịch bản, nhưng chưa có mẫu diễn giải riêng cho trường hợp này.");
  }

  if (p.tong_cam_ket_muc_tieu_thang) lines.push(`- Chị đang cam kết ${fmtVnd(p.tong_cam_ket_muc_tieu_thang)}/tháng cho các mục tiêu tài chính — nên đối chiếu lại với dòng tiền ròng sau kịch bản này.`);

  lines.push("\n(Đây là diễn giải mô phỏng dựng sẵn từ số liệu đã tính, không phải một mô hình AI thật.)");
  return lines.join("\n");
}
