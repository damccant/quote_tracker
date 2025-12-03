"use strict";
var next_row = 0;
function buildNewRow(row)
{
	var new_row = document.createElement("tr");
	new_row.id = `newrow_${row}`;
	new_row.innerHTML = 
		"<td>" +
			`<input id=\"newrow_sku_${row}\" type=\"text\">` +
		"</td>" +
		"<td>" +
			`<input id=\"newrow_desc_${row}\" type=\"text\">` +
		"</td>" +
		"<td style=\"width: 1px;\">" +
			"<div style=\"white-space: nowrap;\">" +
				`<button class=\"btn btn-sm\" onclick=\"new_to_saved(${row});\">` +
					"<i class=\"bi bi-floppy\"></i>" +
				"</button>" +
				`<button class=\"btn btn-sm\" onclick=\"new_to_deleted(${row});\">` +
					"<i class=\"bi bi-x\"></i>" +
				"</button>" +
			"</div>" +
		"</td>";
	return new_row;
}

function new_row()
{
	const newrow = document.getElementById("newsku");
	newrow.insertAdjacentElement('beforebegin', buildNewRow(next_row++));
}

function new_to_saved(row_num)
{
	var row = document.getElementById("newrow_" + row_num);
	const sku = document.getElementById("newrow_sku_" + row_num).value;
	const description = document.getElementById("newrow_desc_" + row_num).value;
	if (sku == undefined || sku == null || sku == "")
	{
		alert("A SKU is required!");
		return;
	}

	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/sku/create', true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.onload = function () {
		if (xhr.status >= 200 && xhr.status < 300) {
			// TODO: do something!
		}
		else {
			alert("Cannot save!");
		}
	};
	var payload = "sku=" + encodeURIComponent(sku);
	if (description != undefined && description != null && description != "")
		payload += "&description=" + encodeURIComponent(description);
	xhr.send(payload);
}

function new_to_deleted(row_num)
{
	document.getElementById("newrow_" + row_num).remove();
}

function saved_to_deleted(sku)
{
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/sku/delete/' + sku, true);
	xhr.onload = function () {
		if (xhr.status >= 200 && xhr.status < 300) {
			document.getElementById("e_r_" + sku).remove();
		}
		else {
			alert("Cannot delete!");
		}
	};
	xhr.send();
}

function saved_edit_to_unsaved(sku)
{
	const description = document.getElementById("e_d_" + sku).innerText;
	var existing_row = document.getElementById("e_r_" + sku);
	var edit_row = document.createElement("tr");
	edit_row.id = "e_r_" + sku;
	var cells = [
		document.createElement("td"),
		document.createElement("td"),
		document.createElement("td")
	];
	var sku_input = document.createElement("input");
	sku_input.id = "e_s_" + sku;
	sku_input.type = "text";
	sku_input.dataset.oldsku = sku;
	sku_input.value = sku;
	var desc_input = document.createElement("input");
	desc_input.id = "e_d_" + sku;
	desc_input.type = "text";
	desc_input.dataset.olddesc = description;
	desc_input.value = description;
	var button_div = document.createElement("div");
	button_div.style = "white-space: nowrap;";
	var save_button = document.createElement("button");
	save_button.classList = "btn btn-sm";
	save_button.onclick = () => unsaved_save_to_saved(sku);
	save_button.innerHTML = "<i class=\"bi bi-floppy\">";
	var revert_button = document.createElement("button");
	revert_button.classList = "btn btn-sm";
	revert_button.onclick = () => unsaved_revert_to_saved(sku);
	revert_button.innerHTML = "<i class=\"bi bi-arrow-counterclockwise\">";
	button_div.append(save_button);
	button_div.append(revert_button);
	cells[0].append(sku_input);
	cells[1].append(desc_input);
	cells[2].append(button_div);
	cells[2].style = "width: 1px;";
	edit_row.append(cells[0]);
	edit_row.append(cells[1]);
	edit_row.append(cells[2]);
	existing_row.replaceWith(edit_row);
}

function unsaved_save_to_saved(sku)
{

}

function unsaved_revert_to_saved(sku)
{

}
