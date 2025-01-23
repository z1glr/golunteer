CREATE TABLE IF NOT EXISTS TASKS (
	taskID INTEGER PRIMARY KEY,
	taskName varchar(64) NOT NULL,
	enabled BOOL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS AVAILABILITIES (
	availabilityID INTEGER PRIMARY KEY,
	availabilityName varchar(32) NOT NULL,
	color varchar(7) NOT NULL,
	enabled BOOL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS USERS (
	userName varchar(64) PRIMARY KEY,
	password BLOB NOT NULL,
	admin BOOL NOT NULL DEFAULT(false),
	tokenID varchar(64) NOT NULL,
	CHECK (length(password) = 60),
	CHECK (length(tokenID) = 36)
);

CREATE TABLE IF NOT EXISTS EVENTS (
	eventID INTEGER PRIMARY KEY,
	date DATETIME NOT NULL,
	description TEXT DEFAULT "" 
);

CREATE TABLE IF NOT EXISTS USER_AVAILABILITIES (
	userName varchar(64) NOT NULL,
	eventID INTEGER NOT NULL,
	availabilityID INTEGER NOT NULL,
	PRIMARY KEY (userName, eventID),
	FOREIGN KEY (userName) REFERENCES USERS(userName) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (eventID) REFERENCES EVENTS(eventID) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (availabilityID) REFERENCES AVAILABILITIES(availabilityID) ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS USER_ASSIGNMENTS (
	eventID INTEGER NOT NULL,
	taskID INTEGER NOT NULL,
	userName varchar(64),
	PRIMARY KEY (eventID, taskID),
	FOREIGN KEY (eventID) REFERENCES EVENTS(eventID) ON DELETE CASCADE,
	FOREIGN KEY (userName) REFERENCES USERS(userName) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (taskID) REFERENCES TASKS(taskID) ON UPDATE CASCADE
);
