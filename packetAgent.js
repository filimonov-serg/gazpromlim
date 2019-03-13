dlgDoc = OpenDoc("x-local://wtv/wtv_dlg_edit_text.xml");
dlgDoc.TopElem.title = "Перечисление объектов для формирования пакетов";
dlgDoc.TopElem.is_rich = false;
Screen.ModalDlg(dlgDoc);

ids = String(dlgDoc.TopElem.desc).split('\r\n');

fldPackage = package_objects.GetChildByKey(local_settings.package_id);
for(i in ids) {
	try {
		_id = Int(i);
		_child = fldPackage.objects.ObtainChildByKey(_id);
		_doc = OpenDoc(UrlFromDocID(_id)).TopElem;
		try {
			_child.name = _doc.name;
		} catch ( gh ) {
			try { _child.name = tools.get_disp_name_value(_doc); } catch (ewr) { }
		}
		_child.type = _doc.Name;

	} catch(e) {
		alert(e)
	}
}
package_objects.Doc.Save();
UpdateScreens( '*', '*view_main*' );
UpdateScreens( '*', '*package_objects*' );
