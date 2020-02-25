/**
 * WARNING: Не используются параметры агента, все задается в коде
 */

/*
Краткое описание:
    Агент для рассылки приглашений для прохождения оценки.

Как пользоваться: 
    1. Выделите в списке анкеты, по которым необходимо запустить агент
    2. Нажмите правую кнопку мыши по выделенному списку
    3. Нажмите "Выполнить агент"
    4. Если записей более 100, то выберите режим запуска  "На сервере..."
    5. Выберите из списка агент "Рассылка приглашений для прохождения оценки"
    6. Готово.

ПРЕДУПРЕЖДЕНИЯ:
    !!!Агент работает для карточек анкет!!!

Автор: Shestakov Leonid
Дата создания: 19.02.2020
*/
//========================START AGENT CONFIG=======================
var AGENT_ID = ""; // ID текущего агента
var ALLOWED_MODES = [
  "C_CLIENT",
  "C_SERVER"
];
/*Cписок доступных режимов работы агента:
                                                                       1. ALL - работа во всех режимах
                                                                       2. A_CLIENT- работа на клиенте и запуск из карточки агента
                                                                       3. A_SERVER- работа на сервере и запуск из карточки агента
                                                                       4. C_CLIENT- работа на клиенте и запуск через "Выполнить агент" 
                                                                       5. C_SERVER- работа на сервере и запуск через "Выполнить агент" 
                                                                       */
var DEBUG_MODE = 0; // Если 0 - то все сообщения пишутся в лог. Если 1 - то выводятся алерты
var AGENT_NOTIF = {
  send_on: 0, // Включить рассылку -1  , 0 - выключить рассылку
  admins_group: "", // ID группы админов, кто должен получать уведомление
  notif_code: "", // Код уведомления для рассылки
  notification_text: "" // Текст, который будет вставлен в уведомление
};
//=========================END AGENT CONFIG=======================
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//================================================================
//=========================START LOG BLOCK========================
//Создаёт событие базы
function create_action_report(dCreateDate, sType) {
  var sReportType = "result"; //default
  if (dCreateDate == undefined || dCreateDate == "")
    throw "create_action_report: 1 param not defined or empty!";

  if (sType != undefined && sType != "") {
    if (
      ArrayOptFind(common.action_report_types, "id==" + XQueryLiteral(sType)) ==
      undefined
    )
      throw "create_action_report: 3 param is not correct.Report type - " +
        sType +
        " not found in DB!";
    else sReportType = sType;
  }
  var docReport = OpenNewDoc("x-local://wtv/wtv_action_report.xmd");
  docReport.BindToDb(DefaultDb);
  docReport.TopElem.create_date = dCreateDate;
  docReport.TopElem.type = sReportType;
  docReport.TopElem.completed = false;
  docReport.Save();
  return docReport;
}
//Добавление сообщения в событие бащы
function add_message_to_report(docReport, msg) {
  if (msg != "") {
    docReport.TopElem.report_text += Date() + " " + msg + "\n";
    docReport.Save();
  }
}
//Устанавливает статуса событию базы
function set_report_state(docReport, bState) {
  if (bState == undefined || bState == "")
    throw "set_report_state: 2 param not defined or empty!";

  docReport.TopElem.completed = bState;
  docReport.Save();
}
//Отправляет уведомления группе пользователей
function send_notification_to_group(iGroupID, sNotifCode, sText) {
  if (iGroupID == undefined || iGroupID == "")
    throw "send_notification_to_group: 1 param not defined or empty!";
  if (sNotifCode == undefined || sNotifCode == "")
    throw "send_notification_to_group: 2 param not defined or empty!";
  if (sText == undefined || sText == "")
    throw "send_notification_to_group: 3 param not defined or empty!";

  var xArrCollabs = XQuery(
    "for $c in group_collaborators where $c/group_id=" + iGroupID + " return $c"
  );
  for (col in xArrCollabs) {
    try {
      tools.create_notification(sNotifCode, col.collaborator_id, sText);
    } catch (ers) {
      continue;
    }
  }
}

//=========================END   LOG BLOCK========================
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//=========================START FUNCTIONS BLOCK==================
//------------------START AGENT FUNCTIONS-------------------
//получение текущего режима работы агента
function get_current_agent_mode() {
  //client
  if (!LdsIsServer) {
    if (OBJECTS_ID_STR == "") return "A_CLIENT";
    else return "C_CLIENT";
  } else {
    //server
    if (OBJECTS_ID_STR == "") return "A_SERVER";
    else return "C_SERVER";
  }
}
//добавление сообщения в лог
function add_message_to_log(msg) {
  if (DEBUG_MODE != 1) return add_message_to_report(REPORT, msg);
  else alert(msg);
}

//добавление информационного сообщения в лог
function add_info_to_log(msg) {
  if (msg != "") return add_message_to_log("[" + AGENT_ID + "] INFO: " + msg);
  else return undefined;
}

//добавление ошибки в лог
function add_error_to_log(msg) {
  if (msg != "") return add_message_to_log("[" + AGENT_ID + "] ERROR: " + msg);
  else return undefined;
}
//добавление текста в сообщение уведомления
function add_text_to_notification(s_text) {
  if (s_text != "") {
    AGENT_NOTIF.notification_text += s_text;
  }
}

//Отправка уведомления админам - сокращённая версия с передачей глобальных параметров
function send_notification_short() {
  return send_notification_to_group(
    AGENT_NOTIF.admins_group,
    AGENT_NOTIF.notif_code,
    AGENT_NOTIF.notification_text
  );
}
// остановка работы агента
function stop_agent(msg) {
  if (DEBUG_MODE != 1) {
    add_error_to_log(msg);
    if (AGENT_NOTIF.send_on == 1) {
      add_text_to_notification(s_text);
      send_notification_short();
    }
    set_report_state(REPORT, 0);
  }
  throw msg; 
}
//------------------END AGENT FUNCTIONS---------------------
//=========================END FUNCTIONS BLOCK====================
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//=========================START HEADER AGENT=====================

/**
 * ERROR: throw вникуда
 */

//получаем карточку текущего агента
try {
  var AGENT_DOC = OpenDoc(UrlFromDocID(AGENT_ID)); // Документ текущего агента
} catch (err) {
  throw "Не установлен или не корректный AGENT_ID!";
}

/**
 * ERROR: throw вникуда
 */

//создаём событие базы
try {
  var REPORT = create_action_report(Date()); // документ события базы
} catch (err) {
  throw err;
}

/**
 * ERROR: stop_agent не прекращает работу агента нормальным способом
 */

//Проверка режима работы агента
if (ArrayOptFind(ALLOWED_MODES, "This=='ALL'") == undefined) {
  if (
    ArrayOptFind(
      ALLOWED_MODES,
      "This==" + XQueryLiteral(get_current_agent_mode())
    ) == undefined
  ) {
    stop_agent("Агент запущен в недопустимом режиме!");
  }
}
//=========================END   HEADER AGENT=====================
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//=========================START BODY AGENT=======================
add_info_to_log("START: Агент рассылки приглашений для прохождения оценки.");
var sNotifCode = "cpr_nt_startappraise_BEF"; // код уведомления
var arrStrObjectsId = []; // массив анкет
var iSendCounter = 0; // счётчик отправки

arrStrObjectsId = OBJECTS_ID_STR.split(";");
//проверим -  по каким объектам у нас запущен агент
/**
 * WARNING: cDoc - пустое открытие документа, дальше нигде не используется
 * ERROR: paDoc - не определен
 */
var cDoc = tools.open_doc(Int(arrStrObjectsId[0]));
if (paDoc.TopElem.Name != "pa") {
  stop_agent("Агент запущен не по анкетам!");
} else {
  for (_obj in arrStrObjectsId) {
    try {
      paDoc = tools.open_doc(Int(_obj));
      if (paDoc != undefined) {
        tools.create_notification(sNotifCode, Int(_obj));
        iSendCounter++;
      } else {
        add_error_to_log(
          " объект с ID - " + Int(_obj) + " удалён или уже открыт."
        );
      }
    } catch (err) {
      add_error_to_log(
        " ошибка при отправке по объекту с ID - " + Int(_obj) + " .  " + err
      );
    }
  }
  add_info_to_log("Было создано " + iSendCounter + " сообщений.");
  add_info_to_log("FINISH: Агент рассылки приглашений для прохождения оценки.");

  /*
-Комментарий разработчика:
Здесь можно установить любой критерий успешной работы агента.
Я выбрал - если по всем выбранным анкетам создались уведомления, то работу можно считать успешной,
в любых других ситуациях - не успешно.
*/
  if (iSendCounter == ArrayCount(arrStrObjectsId)) set_report_state(REPORT, 1);
}
//=========================END   BODY AGENT=======================
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//=========================START FOOTER AGENT=====================

//=========================END   FOOTER AGENT=====================